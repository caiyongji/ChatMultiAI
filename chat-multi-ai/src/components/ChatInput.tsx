// components/ChatInput.jsx
import React, { useState, useRef, useEffect } from 'react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Send, ChevronDown, Plus, History, Settings, Play, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getRemoteConfigValues } from '../lib/remoteConfig';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { functions, auth } from '../background/firebase-app';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { firestore } from '../background/firebase-app';
import type { Prompt, UserSettingsRequest, UserSettingsResponse } from '@shared/UserSettings';
import { streamChat } from '../background/utils';
import { AppBar } from '~chat/AppBar';
// import { syncRemoteUserSetting } from '../background/remoteUserSetting';

const ChatInput = () => {
  const [inputValue, setInputValue] = useState('');
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const [isAtPopoverOpen, setIsAtPopoverOpen] = useState(false);
  const [isSlashPopoverOpen, setIsSlashPopoverOpen] = useState(false);
  const [isComposing, setIsComposing] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamedMessage, setStreamedMessage] = useState('');
  const abortControllerRef = useRef<AbortController | null>(null);
  const textareaRef = useRef(null);

  // Define the Agent interface
  interface Agent {
    id: string;
    name: string;
    avatar: string;
    description: string;
    specialty: string[];
    modelType: string;
  }

  // Define available AI agents
  const agents: Agent[] = [
    {
      id: 'code-expert',
      name: 'CodeMaster',
      avatar: '👨‍💻',
      description: 'Specialized in code review, debugging, and software architecture',
      specialty: ['Code Review', 'Debugging', 'Architecture Design'],
      modelType: 'gpt-4o-mini'
    },
    {
      id: 'data-scientist',
      name: 'DataWizard',
      avatar: '📊',
      description: 'Expert in data analysis, machine learning, and statistical modeling',
      specialty: ['Data Analysis', 'Machine Learning', 'Statistics'],
      modelType: 'gpt-4o-mini'
    },
    {
      id: 'ui-designer',
      name: 'UXPro',
      avatar: '🎨',
      description: 'Focused on UI/UX design, accessibility, and front-end development',
      specialty: ['UI Design', 'UX Research', 'Accessibility'],
      modelType: 'gpt-4o-mini'
    },
    {
      id: 'devops',
      name: 'DevOpsNinja',
      avatar: '🔧',
      description: 'Specialized in CI/CD, deployment, and infrastructure management',
      specialty: ['CI/CD', 'Infrastructure', 'Cloud Services'],
      modelType: 'gpt-4o-mini'
    }
  ];

  // Replace modelList with agents for @ mentions
  const handleAtMention = () => {
    return agents.map(agent => ({
      id: agent.id,
      display: `${agent.avatar} ${agent.name}`
    }));
  };

  const promptList = ['提示词1', '提示词2', '提示词3'];

  const { t } = useTranslation();
  const navigate = useNavigate();

  const openOptionsPage = () => {
    chrome.runtime.openOptionsPage();
  };

  // 添加光标位置相关的 state
  const [cursorPosition, setCursorPosition] = useState<number | null>(null);
  const [triggerPosition, setTriggerPosition] = useState({ top: 0, left: 0 });

  // 添加选中项索引的 state
  const [selectedIndex, setSelectedIndex] = useState(0);

  // 处理输入事件
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    
    // 获取当前光标位置
    const curPos = e.target.selectionStart;
    setCursorPosition(curPos);

    // 检查光标前的字符
    const lastChar = newValue.charAt(curPos - 1);
    const prevChar = newValue.charAt(curPos - 2);
    
    // 只有当 @ 或 / 是单独输入的（前面是空格或是开头）时才触发
    if ((lastChar === '@' || lastChar === '/') && (!prevChar || prevChar === ' ')) {
      // 计算弹出框位置
      const textarea = textareaRef.current;
      if (textarea) {
        const { selectionStart } = textarea;
        const textBeforeCursor = newValue.substring(0, selectionStart);
        const lines = textBeforeCursor.split('\n');
        const currentLineNumber = lines.length - 1;
        const currentLineText = lines[currentLineNumber];
        
        // 创建一个临时 span 来计算文本宽度
        const span = document.createElement('span');
        span.style.font = window.getComputedStyle(textarea).font;
        span.style.visibility = 'hidden';
        span.style.position = 'absolute';
        span.textContent = currentLineText;
        document.body.appendChild(span);
        
        const lineHeight = parseInt(window.getComputedStyle(textarea).lineHeight);
        const textWidth = span.offsetWidth;
        document.body.removeChild(span);

        // 设置弹出框位置
        const rect = textarea.getBoundingClientRect();
        const top = rect.top + (currentLineNumber * lineHeight);
        const left = rect.left + textWidth;

        setTriggerPosition({ top, left });
        setIsAtPopoverOpen(lastChar === '@');
        setIsSlashPopoverOpen(lastChar === '/');
      }
    } else {
      setIsAtPopoverOpen(false);
      setIsSlashPopoverOpen(false);
    }
  };

  // 处理选择项
  const handleSelectItem = (item: string) => {
    if (!cursorPosition) return;

    const selectedAgent = agents.find(agent => `${agent.avatar} ${agent.name}` === item);
    if (selectedAgent) {
      setSelectedAgent(selectedAgent);
      // Replace trigger character with selected agent
      const beforeTrigger = inputValue.slice(0, cursorPosition - 1);
      const afterTrigger = inputValue.slice(cursorPosition);
      setInputValue(`${beforeTrigger}@${selectedAgent.name} ${afterTrigger}`);
    } else {
      // Handle regular prompt selection
      const beforeTrigger = inputValue.slice(0, cursorPosition - 1);
      const afterTrigger = inputValue.slice(cursorPosition);
      setInputValue(`${beforeTrigger}${item} ${afterTrigger}`);
    }
    
    setIsAtPopoverOpen(false);
    setIsSlashPopoverOpen(false);
  };

  // 处理键盘事件
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // 处理上下键选择
    if ((isAtPopoverOpen || isSlashPopoverOpen) && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
      e.preventDefault();
      const items = isAtPopoverOpen ? handleAtMention() : promptList;
      
      setSelectedIndex(prevIndex => {
        if (e.key === 'ArrowUp') {
          return prevIndex <= 0 ? items.length - 1 : prevIndex - 1;
        } else {
          return prevIndex >= items.length - 1 ? 0 : prevIndex + 1;
        }
      });
    }

    
    // 原有的发送消息逻辑
    else if (e.key === 'Enter' && (e.ctrlKey || e.shiftKey)) {
      e.preventDefault();
      console.log('发送消息:', inputValue);
      setInputValue('');
    }
    
    // ESC 键关闭弹出层
    else if (e.key === 'Escape') {
      setIsAtPopoverOpen(false);
      setIsSlashPopoverOpen(false);
      setSelectedIndex(0);
    }
  };

  // 处理输入法事件
  const handleCompositionStart = () => {
    setIsComposing(true);
  };

  const handleCompositionEnd = () => {
    setIsComposing(false);
  };

  // 测试 Firestore 连接
  const testFirestoreConnection = async () => {
    console.log('Testing Firestore connection...');
    try {
      const connect2FirestoreFunc = httpsCallable(functions, 'connect2Firestore');
      const result = await connect2FirestoreFunc();
      console.log('Firestore connection test result:', result);
      setWelcomeMessage(JSON.stringify(result.data, null, 2));
    } catch (error) {
      console.error('Error testing Firestore connection:', error);
      setWelcomeMessage('Error: ' + JSON.stringify(error));
    }
  };

  // Function to test direct Firestore connection
  const testFirestoreDirectConnection = async () => {
    try {
      if (!auth.currentUser) {
        console.error('User not authenticated');
        return;
      }

      // Get reference to the user's messages collection
      const userMessagesRef = collection(firestore, 'users', auth.currentUser.uid, 'messages');
      
      // Add a new message
      const docRef = await addDoc(userMessagesRef, {
        message: 'Test message from direct Firestore connection',
        timestamp: serverTimestamp(),
      });

      console.log('Message added with ID: ', docRef.id);
      setWelcomeMessage('Successfully connected to Firestore directly! Message ID: ' + docRef.id);
    } catch (error) {
      console.error('Error writing to Firestore:', error);
      setWelcomeMessage('Error connecting to Firestore: ' + error.message);
    }
  };

  const formatMessage = (data: any): string => {
    try {
      return typeof data === 'string' ? data : JSON.stringify(data, null, 2);
    } catch (e) {
      return String(data);
    }
  };

  const testUserSettings = async () => {
    try {
      const userSettingsRequest: UserSettingsRequest = {
        action: "update",
        data: {
          generalSettings: {
            theme: "dark",
            language: "zh",
            lastUpdatedTime: new Date().toISOString()
          },
          promptSettings: {
            instructionSettings: {
              custom_instruction: "Test custom instruction",
              respond_instruction: "Test respond instruction",
              is_enabled_for_new_chat: true,
              lastUpdatedTime: new Date().toISOString()
            },
            prompts: [
              // {
              //   id: "test-prompt-1",
              //   title: "Test Prompt 1",
              //   content: "This is a test prompt content",
              //   lastUpdatedTime: new Date().toISOString()
              // },
              {
                title: "Test Prompt  new new new",
                content: "This is a test prompt content new",
                lastUpdatedTime: new Date().toISOString()
              }
            ],
            lastUpdatedTime: new Date().toISOString()
          },
          agentSettings: {
            agents: [
              {
                id: "test-agent-1",
                name: "Test Agent",
                settings: {
                  key1: "value1",
                  key2: "value2"
                },
                lastUpdatedTime: new Date().toISOString()
              },
              {
                id: "test-agent-2",
                name: "Test Agent2",
                settings: {
                  key1: "value1",
                  key2: "value2"
                },
                lastUpdatedTime: new Date().toISOString()
              }
            ],
            lastUpdatedTime: new Date().toISOString()
          },
          lastUpdatedTime: new Date().toISOString()
        }
      };
      
      const processUserSettings = httpsCallable<UserSettingsRequest, UserSettingsResponse>(functions, 'processUserSettings');
      const result = await processUserSettings(userSettingsRequest);
      const response: UserSettingsResponse = result.data;
      
      if (response.success) {
        console.log('User settings updated successfully:', response.data);
        setWelcomeMessage(formatMessage({
          message: 'Settings updated successfully!',
          data: response.data
        }));
      } else {
        console.error('Failed to update user settings:', response.error);
        setWelcomeMessage(`Error updating settings: ${response.error}`);
      }
    } catch (error) {
      console.error('Error calling processUserSettings:', error);
      setWelcomeMessage('Error calling processUserSettings: ' + formatMessage(error));
    }
  };

  const testGetUserSettings = async (): Promise<void> => {
    try {
      const userSettingsRequest: UserSettingsRequest = {
        action: "get",
        data: undefined
      };
      
      const processUserSettings = httpsCallable<UserSettingsRequest, UserSettingsResponse>(functions, 'processUserSettings');
      const result = await processUserSettings(userSettingsRequest);
      const response: UserSettingsResponse = result.data;
      
      if (response.success) {
        console.log('Get user settings result:', response.data);
        setWelcomeMessage(formatMessage(response.data));
      } else {
        console.error('Failed to get user settings:', response.error);
        setWelcomeMessage(`Error getting settings: ${response.error}`);
      }
    } catch (error) {
      console.error('Error getting user settings:', error);
      setWelcomeMessage('Error: ' + formatMessage(error));
    }
  };

  const getFirebaseToken = async () => {
    const user = auth.currentUser;
    if (user) {
      try {
        const idToken = await user.getIdToken(true);
        setWelcomeMessage(idToken);
      } catch (error) {
        setWelcomeMessage('Error getting token: ' + error.message);
      }
    } else {
      setWelcomeMessage('No user is signed in');
    }
  };

  const handlePlayCase = async () => {
    if (isStreaming) {
      // Stop streaming
      abortControllerRef.current?.abort();
      abortControllerRef.current = null;
      setIsStreaming(false);
    } else {
      // Check if there's input text
      if (!inputValue.trim()) {
        setStreamedMessage("Please enter a question first.");
        return;
      }

      // Start streaming
      const controller = new AbortController();
      abortControllerRef.current = controller;
      setIsStreaming(true);
      setStreamedMessage(''); // Clear previous message
      
      try {
        const token = await auth.currentUser?.getIdToken() || "";
        // await streamChat(
        //   controller, 
        //   token, 
        //   inputValue,
        //   (chunk) => {
        //     // Parse the SSE data format
        //     const lines = chunk.split('\n');
        //     lines.forEach(line => {
        //       if (line.startsWith('data: ')) {
        //         const data = line.slice(5); // Remove 'data: ' prefix
        //         if (data === '[DONE]') {
        //           return;
        //         }
        //         try {
        //           const parsed = JSON.parse(data);
        //           if (parsed.content) {
        //             setStreamedMessage(prev => prev + parsed.content);
        //           } else if (parsed.error) {
        //             console.error("Stream error:", parsed.error);
        //             setStreamedMessage(prev => prev + "\nError: " + parsed.error);
        //           }
        //         } catch (e) {
        //           console.error("Failed to parse SSE data:", e);
        //         }
        //       }
        //     });
        //   }
        // );
      } catch (error) {
        console.error("Streaming error:", error);
        setStreamedMessage(prev => prev + "\nError: " + (error as Error).message);
      } finally {
        setIsStreaming(false);
        abortControllerRef.current = null;
      }
    }
  };

  // 自动调整高度
  useEffect(() => {
    const textarea = textareaRef.current;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
  }, [inputValue]);

  // 当弹出层打开时重置选中索引
  useEffect(() => {
    if (isAtPopoverOpen || isSlashPopoverOpen) {
      setSelectedIndex(0);
    }
  }, [isAtPopoverOpen, isSlashPopoverOpen]);

  return (
    <div className="flex flex-col h-full">
      {/* App Bar */}
      <AppBar />

      {/* 原有的聊天输入区域，添加 flex-1 和 p-4 类 */}
      <div className="relative w-full flex-1 p-4">
        {(welcomeMessage || streamedMessage) && (
          <div className="mb-2 p-2 bg-muted rounded">
            <pre className="text-xs overflow-auto whitespace-pre max-h-[400px]">
              {streamedMessage || welcomeMessage}
            </pre>
          </div>
        )}
        <div className="grid grid-cols-2 gap-2 mb-2">
          <Button
            onClick={async () => {
              let prompts: Prompt[] = [];
              try {
                  const config = await getRemoteConfigValues();
                  const rawString = config.system_prompts;
                  prompts = JSON.parse(rawString) as Prompt[];
              } catch (error) {
                  console.error("Failed to parse system_prompts:", error);
              }
                setWelcomeMessage(JSON.stringify(prompts, null, 2));
            }}
            size="sm"
          >
            Remote Config
          </Button>
          <Button onClick={testFirestoreConnection} size="sm">
            Test Connection
          </Button>
          <Button onClick={testFirestoreDirectConnection} size="sm">
            Direct FireStore
          </Button>
          <Button onClick={testUserSettings} size="sm">
            Update Settings
          </Button>
          <Button onClick={testGetUserSettings} size="sm">
            Get Settings
          </Button>
          <Button onClick={() => {
            console.log('Test theme....');
            chrome.runtime.sendMessage({ type: 'testTheme' });
          }} size="sm">
            Test Theme
          </Button>
          {/*<Button onClick={() => /**syncRemoteUserSetting()*!/>test sync</Button>*/}
          <Button onClick={getFirebaseToken} size="sm">
            Get Token
          </Button>
          <Button onClick={handlePlayCase} size="sm">
            {isStreaming ? (
              <>
                <Square className="h-4 w-4 mr-2" />
                Stop Stream
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Play Case
              </>
            )}
          </Button>
        </div>
        <textarea
          ref={textareaRef}
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onCompositionStart={handleCompositionStart}
          onCompositionEnd={handleCompositionEnd}
          className="w-full max-h-40 overflow-y-auto p-2 border border-input rounded resize-none bg-background focus:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          placeholder="输入消息..."
        />

        {/* 模型列表弹出层 */}
        {isAtPopoverOpen && !isComposing && (
          <div 
            className="absolute bg-popover border border-border rounded shadow-md z-50 min-w-[250px]"
            style={{
              top: `${triggerPosition.top}px`,
              left: `${triggerPosition.left}px`
            }}
          >
            {handleAtMention().map((agent, index) => (
              <div
                key={agent.id}
                className={`p-2 cursor-pointer transition-colors duration-100
                  ${index === selectedIndex 
                    ? 'bg-primary text-primary-foreground font-medium' 
                    : 'text-popover-foreground hover:bg-accent/50'
                  }`}
                onClick={() => handleSelectItem(agent.display)}
              >
                <div className="flex flex-col">
                  <span className="font-medium">{agent.display}</span>
                  <span className="text-xs text-muted-foreground">
                    {agents.find(a => a.id === agent.id)?.description}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 提示词弹出层 */}
        {isSlashPopoverOpen && !isComposing && (
          <div 
            className="absolute bg-popover border border-border rounded shadow-md z-50 min-w-[150px]"
            style={{
              top: `${triggerPosition.top}px`,
              left: `${triggerPosition.left}px`
            }}
          >
            {promptList.map((prompt, index) => (
              <div
                key={prompt}
                className={`p-2 cursor-pointer transition-colors duration-100
                  ${index === selectedIndex 
                    ? 'bg-primary text-primary-foreground font-medium' 
                    : 'text-popover-foreground hover:bg-accent/50'
                  }`}
                onClick={() => handleSelectItem(prompt)}
              >
                {prompt}
              </div>
            ))}
          </div>
        )}

        {/* 发送按钮 */}
        <button
          onClick={() => {
            console.log('发送消息:', inputValue);
            setInputValue('');
          }}
          className="absolute right-2 bottom-2 text-primary hover:text-primary/80"
        >
          <Send />
        </button>
      </div>
    </div>
  );
};

export default ChatInput;
