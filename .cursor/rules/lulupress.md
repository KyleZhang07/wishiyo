## LuluPress API打印要求

要使用LuluPress API打印您的书籍，您需要提供以下信息：

### 1. API认证信息
- 客户端密钥（client_key）
- 客户端密钥（client_secret）
- 或者base64编码的组合密钥

### 2. PDF文件规格

#### 内部页面PDF要求：
- 单个PDF文件包含所有内容（包括版权页和空白页）
- 图像分辨率：300 PPI
- 所有字体必须嵌入或转换为轮廓
- 扁平化所有透明图层和矢量对象
- 使用单页布局
- PDF页面尺寸要匹配创建的书籍，包括0.125英寸的出血尺寸
- 所有内容需要0.5英寸的安全边距
- 所有页面内侧边缘需要至少0.2英寸的装订线边距
- 不要包含裁剪标记或出血标记
- 不要使用任何安全/密码文件保护

#### 封面PDF要求：
- 整个封面（包括封底、书脊和封面）需合并为单页PDF
- 图像分辨率：最小300 PPI，最大600 PPI
- 矢量图应被栅格化
- 所有字体必须嵌入或转换为轮廓
- 扁平化所有透明图层和矢量对象
- 使用单页布局
- PDF尺寸要匹配提供的规格（书脊宽度取决于页数）
- 包括0.125英寸的出血尺寸，所有内容至少0.25英寸的安全边距（精装书为0.75英寸）
- 不要包含裁剪标记或出血标记
- 不要使用任何安全/密码文件保护

### 3. 打印作业信息
创建打印订单时需要提供：

```python
book = {
   "external_id": "您的外部ID",
   "title": "书名",
   "cover_source_url": "封面PDF的URL",
   "interior_source_url": "内页PDF的URL",
   "pod_package_id": "印刷包ID", # 例如"0550X0850BWSTDPB060UW444GXX"
   "quantity": 1, # 印刷数量
}

address = {
   "name": "收件人姓名",
   "street1": "街道地址1",
   "street2": "街道地址2（可选）",
   "city": "城市",
   "postcode": "邮编",
   "state_code": "州/省代码",
   "country_code": "国家代码", # 例如"CN"
   "phone_number": "电话号码",
}

# 创建打印作业
apiclient.create_print_job(address, books, shipping_level="GROUND", external_id="打印作业ID")
```

### 4. 颜色空间要求
- 建议使用sRGB或CMYK色彩空间
- 如果您的文件是在CMYK中创建的，建议在导出时保持此色彩空间
- 实心黑色应为100%，不添加其他颜色
- 如果添加颜色来增强黑色的丰富度，总面积覆盖率(TAC)不应超过270%
- 避免使用低于20%的颜色构建
- 对于彩色书籍中的黑白图像，应将色彩空间设置为灰度
- 灰度图像的伽马值应在2.2到2.4之间
