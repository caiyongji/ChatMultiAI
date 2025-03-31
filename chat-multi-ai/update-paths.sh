#!/bin/bash

# 更新所有组件中的导入路径
find src -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i '' 's/from "~\/lib\/utils"/from "@\/lib\/utils"/g'
find src -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i '' 's/from "~\//from "@\//g'
find src -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i '' 's/import cssText from "data-text:~\//import cssText from "data-text:@\//g'

echo "导入路径已更新。" 