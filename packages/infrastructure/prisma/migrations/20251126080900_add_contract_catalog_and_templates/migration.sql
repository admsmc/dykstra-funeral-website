-- CreateEnum
CREATE TYPE "ProductCategory" AS ENUM ('CASKET', 'URN', 'VAULT', 'FLOWERS', 'MEMORIAL_CARDS', 'GUEST_BOOK', 'JEWELRY', 'KEEPSAKE', 'MISCELLANEOUS');

-- CreateTable
CREATE TABLE "product_catalog" (
    "id" TEXT NOT NULL,
    "funeralHomeId" TEXT,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" "ProductCategory" NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "imageUrl" TEXT,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_catalog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_catalog" (
    "id" TEXT NOT NULL,
    "funeralHomeId" TEXT,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "serviceType" "ServiceType" NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_catalog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contract_templates" (
    "id" TEXT NOT NULL,
    "funeralHomeId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "serviceType" "ServiceType",
    "content" TEXT NOT NULL,
    "variables" JSONB NOT NULL DEFAULT '[]',
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "version" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "contract_templates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "product_catalog_sku_key" ON "product_catalog"("sku");

-- CreateIndex
CREATE INDEX "product_catalog_funeralHomeId_idx" ON "product_catalog"("funeralHomeId");

-- CreateIndex
CREATE INDEX "product_catalog_category_idx" ON "product_catalog"("category");

-- CreateIndex
CREATE INDEX "product_catalog_isAvailable_idx" ON "product_catalog"("isAvailable");

-- CreateIndex
CREATE UNIQUE INDEX "service_catalog_code_key" ON "service_catalog"("code");

-- CreateIndex
CREATE INDEX "service_catalog_funeralHomeId_idx" ON "service_catalog"("funeralHomeId");

-- CreateIndex
CREATE INDEX "service_catalog_serviceType_idx" ON "service_catalog"("serviceType");

-- CreateIndex
CREATE INDEX "service_catalog_isAvailable_idx" ON "service_catalog"("isAvailable");

-- CreateIndex
CREATE INDEX "contract_templates_funeralHomeId_idx" ON "contract_templates"("funeralHomeId");

-- CreateIndex
CREATE INDEX "contract_templates_serviceType_idx" ON "contract_templates"("serviceType");

-- CreateIndex
CREATE INDEX "contract_templates_isDefault_idx" ON "contract_templates"("isDefault");

-- CreateIndex
CREATE INDEX "contract_templates_isActive_idx" ON "contract_templates"("isActive");

-- AddForeignKey
ALTER TABLE "product_catalog" ADD CONSTRAINT "product_catalog_funeralHomeId_fkey" FOREIGN KEY ("funeralHomeId") REFERENCES "funeral_homes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_catalog" ADD CONSTRAINT "service_catalog_funeralHomeId_fkey" FOREIGN KEY ("funeralHomeId") REFERENCES "funeral_homes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contract_templates" ADD CONSTRAINT "contract_templates_funeralHomeId_fkey" FOREIGN KEY ("funeralHomeId") REFERENCES "funeral_homes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contract_templates" ADD CONSTRAINT "contract_templates_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
