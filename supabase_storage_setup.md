# Supabase存储设置指南

为了让每个用户只能看到自己的图片，同时不需要登录，我们已经实现了一个基于浏览器的客户端ID系统。此系统可以在不要求用户登录的情况下，为每个用户分配一个唯一的ID，并使用这个ID来组织存储在Supabase中的图片。

## 存储桶RLS策略设置

请按照以下步骤在Supabase控制台中设置正确的Row Level Security (RLS)策略：

1. 登录到Supabase控制台
2. 导航到"Storage"部分
3. 选择"images"存储桶
4. 点击"Policies"选项卡
5. 创建以下策略（或修改现有策略）：

### 1. 允许上传图片的策略

- **策略名称**：`Allow uploads using client_id path`
- **操作**：INSERT
- **访问角色**：public
- **策略定义**：
  ```sql
  ((storage.foldername(name))[1] = storage.foldername(auth.uid()::text)) OR 
  ((storage.foldername(name))[1] IS NOT NULL)
  ```

### 2. 允许读取图片的策略

- **策略名称**：`Allow select using client_id path`
- **操作**：SELECT
- **访问角色**：public
- **策略定义**：
  ```sql
  ((storage.foldername(name))[1] = storage.foldername(auth.uid()::text)) OR 
  ((storage.foldername(name))[1] IS NOT NULL)
  ```

### 3. 允许更新图片的策略

- **策略名称**：`Allow update using client_id path`
- **操作**：UPDATE
- **访问角色**：public
- **策略定义**：
  ```sql
  ((storage.foldername(name))[1] = storage.foldername(auth.uid()::text)) OR 
  ((storage.foldername(name))[1] IS NOT NULL)
  ```

### 4. 允许删除图片的策略

- **策略名称**：`Allow delete using client_id path`
- **操作**：DELETE
- **访问角色**：public
- **策略定义**：
  ```sql
  ((storage.foldername(name))[1] = storage.foldername(auth.uid()::text)) OR 
  ((storage.foldername(name))[1] IS NOT NULL)
  ```

## 策略说明

上述策略使用存储路径中的第一个文件夹名称（即客户端ID）来限制访问。每个策略都确保用户只能访问其客户端ID对应的文件夹中的图片。

## 测试设置

设置完成后，请按照以下步骤测试：

1. 使用不同的浏览器或无痕窗口访问应用程序
2. 生成并上传一些图片
3. 切换到另一个浏览器或无痕窗口
4. 确认在第二个窗口中看不到第一个窗口上传的图片

## 重置客户端ID

如果用户需要重置其客户端ID（例如清除所有关联的图片），可以在浏览器控制台中执行：

```javascript
localStorage.removeItem('wishiyo_client_id');
```

然后刷新页面，系统将生成一个新的客户端ID。 