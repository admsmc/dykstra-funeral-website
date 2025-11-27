import 'dotenv/config'
import { defineConfig, env } from 'prisma/config'

export default defineConfig({
  schema: 'packages/infrastructure/prisma/schema.prisma',
  migrations: {
    path: 'packages/infrastructure/prisma/migrations',
    seed: 'tsx packages/infrastructure/prisma/seed.ts',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
})
