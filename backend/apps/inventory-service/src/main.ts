import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for all origins
  app.enableCors({
    origin: "*",
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: false,
  });

  const port =
    (process.env as Record<string, string | undefined>)["PORT"] || 3004;
  await app.listen(port);

  console.log(`📦 Inventory Service running on port ${port}`);
  console.log(`📊 Health check: http://localhost:${port}/health`);
}

bootstrap().catch((error) => {
  console.error("Failed to start Inventory Service:", error);
  process.exit(1);
});
