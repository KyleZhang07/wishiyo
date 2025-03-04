// 这是一个简单的测试脚本，用于检查Deno环境
console.log("Testing Deno environment...");

// 测试基本的Deno API功能
console.log(`Deno version: ${Deno.version.deno}`);
console.log(`TypeScript version: ${Deno.version.typescript}`);
console.log(`V8 version: ${Deno.version.v8}`);

// 创建一个简单的HTTP服务器
Deno.serve({ port: 8000 }, (req) => {
  return new Response("Deno environment is working correctly!");
});

// 此脚本可以通过运行以下命令来测试:
// deno run --allow-net test-deno-env.ts 