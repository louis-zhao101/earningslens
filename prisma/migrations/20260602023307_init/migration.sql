-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "ticker" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sector" TEXT,
    "industry" TEXT,
    "marketCap" BIGINT,
    "exchange" TEXT,
    "description" TEXT,
    "website" TEXT,
    "employees" INTEGER,
    "country" TEXT DEFAULT 'US',
    "logo" TEXT,
    "ceo" TEXT,
    "ipoDate" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EarningsEvent" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "reportDate" TIMESTAMP(3) NOT NULL,
    "fiscalPeriod" TEXT NOT NULL,
    "fiscalQuarter" INTEGER,
    "fiscalYear" INTEGER,
    "callTime" TEXT,
    "epsEstimate" DOUBLE PRECISION,
    "epsActual" DOUBLE PRECISION,
    "epsSurprise" DOUBLE PRECISION,
    "epsSurprisePct" DOUBLE PRECISION,
    "revenueEstimate" BIGINT,
    "revenueActual" BIGINT,
    "revenueSurprise" BIGINT,
    "revenueSurprisePct" DOUBLE PRECISION,
    "isConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "isUpcoming" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EarningsEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockPrice" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "open" DOUBLE PRECISION NOT NULL,
    "high" DOUBLE PRECISION NOT NULL,
    "low" DOUBLE PRECISION NOT NULL,
    "close" DOUBLE PRECISION NOT NULL,
    "volume" BIGINT NOT NULL,
    "adjClose" DOUBLE PRECISION,

    CONSTRAINT "StockPrice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinancialStatement" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "fiscalYear" INTEGER NOT NULL,
    "fiscalQuarter" INTEGER,
    "revenue" BIGINT,
    "grossProfit" BIGINT,
    "operatingIncome" BIGINT,
    "netIncome" BIGINT,
    "eps" DOUBLE PRECISION,
    "ebitda" BIGINT,
    "totalAssets" BIGINT,
    "totalDebt" BIGINT,
    "freeCashFlow" BIGINT,
    "reportedDate" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FinancialStatement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MacroIndicator" (
    "id" TEXT NOT NULL,
    "series" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "unit" TEXT,

    CONSTRAINT "MacroIndicator_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Company_ticker_key" ON "Company"("ticker");

-- CreateIndex
CREATE INDEX "EarningsEvent_companyId_idx" ON "EarningsEvent"("companyId");

-- CreateIndex
CREATE INDEX "EarningsEvent_reportDate_idx" ON "EarningsEvent"("reportDate");

-- CreateIndex
CREATE INDEX "StockPrice_companyId_date_idx" ON "StockPrice"("companyId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "StockPrice_companyId_date_key" ON "StockPrice"("companyId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "FinancialStatement_companyId_period_fiscalYear_fiscalQuarte_key" ON "FinancialStatement"("companyId", "period", "fiscalYear", "fiscalQuarter");

-- CreateIndex
CREATE INDEX "MacroIndicator_series_date_idx" ON "MacroIndicator"("series", "date");

-- CreateIndex
CREATE UNIQUE INDEX "MacroIndicator_series_date_key" ON "MacroIndicator"("series", "date");

-- AddForeignKey
ALTER TABLE "EarningsEvent" ADD CONSTRAINT "EarningsEvent_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockPrice" ADD CONSTRAINT "StockPrice_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialStatement" ADD CONSTRAINT "FinancialStatement_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
