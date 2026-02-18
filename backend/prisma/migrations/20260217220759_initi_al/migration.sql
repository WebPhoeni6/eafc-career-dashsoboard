-- CreateEnum
CREATE TYPE "Position" AS ENUM ('GK', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'LW', 'RW', 'CF', 'ST');

-- CreateEnum
CREATE TYPE "PreferredFoot" AS ENUM ('Left', 'Right');

-- CreateEnum
CREATE TYPE "Competition" AS ENUM ('Friendly', 'League', 'Cup', 'UCL', 'UEL', 'International', 'Other');

-- CreateEnum
CREATE TYPE "Stage" AS ENUM ('NA', 'Group', 'RoundOf16', 'QuarterFinal', 'SemiFinal', 'Final');

-- CreateEnum
CREATE TYPE "ManagerTrust" AS ENUM ('Full', 'High', 'Medium', 'Low');

-- CreateEnum
CREATE TYPE "SkillCategory" AS ENUM ('Pace', 'Dribbling', 'Finishing', 'Passing', 'Physicality', 'Defending', 'WeakFoot', 'SkillMoves', 'Other');

-- CreateEnum
CREATE TYPE "SuspensionType" AS ENUM ('Yellow', 'Red', 'Accumulated');

-- CreateEnum
CREATE TYPE "PressTag" AS ENUM ('Praise', 'Rumor', 'Transfer', 'Objective', 'Other');

-- CreateEnum
CREATE TYPE "OfferStatus" AS ENUM ('Pending', 'Accepted', 'Rejected', 'Expired');

-- CreateEnum
CREATE TYPE "RoleType" AS ENUM ('Crucial', 'Important', 'Rotation', 'Bench');

-- CreateEnum
CREATE TYPE "TrainingGrade" AS ENUM ('A', 'B', 'C', 'D');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Token" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Token_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Career" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "saveName" TEXT NOT NULL,
    "playerName" TEXT NOT NULL,
    "nationality" TEXT NOT NULL,
    "archetype" TEXT NOT NULL,
    "primaryPos" "Position" NOT NULL,
    "secondaryPos" "Position",
    "club" TEXT NOT NULL,
    "season" TEXT NOT NULL,
    "ovr" INTEGER NOT NULL,
    "spAvailable" INTEGER NOT NULL,
    "height" TEXT NOT NULL,
    "weight" TEXT NOT NULL,
    "preferredFoot" "PreferredFoot" NOT NULL,
    "weakFootStars" INTEGER NOT NULL,
    "skillMoves" INTEGER NOT NULL,
    "badgeUrl" TEXT,
    "flagUrl" TEXT,
    "profileUpdatedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Career_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Match" (
    "id" TEXT NOT NULL,
    "careerId" TEXT NOT NULL,
    "competition" "Competition" NOT NULL,
    "stage" "Stage" NOT NULL,
    "matchDate" TEXT NOT NULL,
    "opponent" TEXT NOT NULL,
    "posPlayed" "Position" NOT NULL,
    "scoreFor" INTEGER NOT NULL,
    "scoreAgainst" INTEGER NOT NULL,
    "minutesPlayed" INTEGER NOT NULL,
    "matchRating" DOUBLE PRECISION NOT NULL,
    "goals" INTEGER NOT NULL,
    "assists" INTEGER NOT NULL,
    "shots" INTEGER NOT NULL,
    "shotsOnTarget" INTEGER NOT NULL,
    "xG" DOUBLE PRECISION NOT NULL,
    "keyPasses" INTEGER NOT NULL,
    "chancesCreated" INTEGER NOT NULL,
    "dribblesAttempted" INTEGER NOT NULL,
    "dribblesCompleted" INTEGER NOT NULL,
    "passAccuracy" DOUBLE PRECISION NOT NULL,
    "crossAccuracy" DOUBLE PRECISION NOT NULL,
    "motm" BOOLEAN NOT NULL,
    "clutchMoment" BOOLEAN NOT NULL,
    "objectivesCompleted" BOOLEAN NOT NULL,
    "objectivesNotes" TEXT NOT NULL,
    "opponentStrength" INTEGER NOT NULL,
    "ovrAfter" INTEGER,
    "spAfter" INTEGER,
    "trust" "ManagerTrust" NOT NULL,
    "notes" TEXT NOT NULL,
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Match_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Trophy" (
    "id" TEXT NOT NULL,
    "careerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "competition" TEXT NOT NULL,
    "season" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Trophy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeasonChallenge" (
    "id" TEXT NOT NULL,
    "careerId" TEXT NOT NULL,
    "season" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "target" INTEGER NOT NULL,
    "current" INTEGER NOT NULL,
    "unit" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SeasonChallenge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NarrativeTag" (
    "id" TEXT NOT NULL,
    "careerId" TEXT NOT NULL,
    "season" TEXT NOT NULL,
    "tag" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NarrativeTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SkillSpend" (
    "id" TEXT NOT NULL,
    "careerId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "pointsSpent" INTEGER NOT NULL,
    "category" "SkillCategory" NOT NULL,
    "attributeTarget" TEXT NOT NULL,
    "fromValue" INTEGER NOT NULL,
    "toValue" INTEGER NOT NULL,
    "notes" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SkillSpend_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttributeTarget" (
    "id" TEXT NOT NULL,
    "careerId" TEXT NOT NULL,
    "attribute" TEXT NOT NULL,
    "currentValue" INTEGER NOT NULL,
    "targetValue" INTEGER NOT NULL,
    "deadline" TEXT NOT NULL,
    "achieved" BOOLEAN NOT NULL,
    "notes" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AttributeTarget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArchetypeStage" (
    "id" TEXT NOT NULL,
    "careerId" TEXT NOT NULL,
    "archetype" TEXT NOT NULL,
    "stage" INTEGER NOT NULL,
    "currentPerks" JSONB NOT NULL,
    "nextUnlock" TEXT NOT NULL,
    "checklist" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ArchetypeStage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingLog" (
    "id" TEXT NOT NULL,
    "careerId" TEXT NOT NULL,
    "week" TEXT NOT NULL,
    "drills" JSONB NOT NULL,
    "grade" "TrainingGrade" NOT NULL,
    "xpGained" INTEGER NOT NULL,
    "notes" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrainingLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransferOffer" (
    "id" TEXT NOT NULL,
    "careerId" TEXT NOT NULL,
    "club" TEXT NOT NULL,
    "league" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "role" "RoleType" NOT NULL,
    "wage" TEXT NOT NULL,
    "fee" TEXT NOT NULL,
    "hasUCL" BOOLEAN NOT NULL,
    "status" "OfferStatus" NOT NULL,
    "receivedDate" TEXT NOT NULL,
    "decisionDate" TEXT,
    "notes" TEXT NOT NULL,
    "score" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TransferOffer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contract" (
    "id" TEXT NOT NULL,
    "careerId" TEXT NOT NULL,
    "club" TEXT NOT NULL,
    "league" TEXT NOT NULL,
    "startSeason" TEXT NOT NULL,
    "endSeason" TEXT NOT NULL,
    "apps" INTEGER NOT NULL,
    "goals" INTEGER NOT NULL,
    "assists" INTEGER NOT NULL,
    "avgRating" DOUBLE PRECISION NOT NULL,
    "trophies" JSONB NOT NULL,
    "notes" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Contract_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentNote" (
    "id" TEXT NOT NULL,
    "careerId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "tag" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AgentNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InjuryLog" (
    "id" TEXT NOT NULL,
    "careerId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "startDate" TEXT NOT NULL,
    "returnDate" TEXT,
    "matchesMissed" INTEGER NOT NULL,
    "notes" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InjuryLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Suspension" (
    "id" TEXT NOT NULL,
    "careerId" TEXT NOT NULL,
    "type" "SuspensionType" NOT NULL,
    "matchesMissed" INTEGER NOT NULL,
    "competition" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "notes" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Suspension_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PressNote" (
    "id" TEXT NOT NULL,
    "careerId" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "tag" "PressTag",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PressNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Achievement" (
    "id" TEXT NOT NULL,
    "careerId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "unlockedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Achievement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Token_tokenHash_key" ON "Token"("tokenHash");

-- CreateIndex
CREATE INDEX "Token_userId_idx" ON "Token"("userId");

-- CreateIndex
CREATE INDEX "Token_expiresAt_idx" ON "Token"("expiresAt");

-- CreateIndex
CREATE INDEX "Career_userId_idx" ON "Career"("userId");

-- CreateIndex
CREATE INDEX "Career_userId_isActive_idx" ON "Career"("userId", "isActive");

-- CreateIndex
CREATE INDEX "Career_createdAt_idx" ON "Career"("createdAt");

-- CreateIndex
CREATE INDEX "Match_careerId_matchDate_idx" ON "Match"("careerId", "matchDate");

-- CreateIndex
CREATE INDEX "Match_careerId_competition_idx" ON "Match"("careerId", "competition");

-- CreateIndex
CREATE INDEX "Match_careerId_posPlayed_idx" ON "Match"("careerId", "posPlayed");

-- CreateIndex
CREATE INDEX "Match_careerId_pinned_idx" ON "Match"("careerId", "pinned");

-- CreateIndex
CREATE INDEX "Trophy_careerId_idx" ON "Trophy"("careerId");

-- CreateIndex
CREATE INDEX "SeasonChallenge_careerId_idx" ON "SeasonChallenge"("careerId");

-- CreateIndex
CREATE INDEX "NarrativeTag_careerId_idx" ON "NarrativeTag"("careerId");

-- CreateIndex
CREATE INDEX "SkillSpend_careerId_idx" ON "SkillSpend"("careerId");

-- CreateIndex
CREATE INDEX "AttributeTarget_careerId_idx" ON "AttributeTarget"("careerId");

-- CreateIndex
CREATE UNIQUE INDEX "ArchetypeStage_careerId_key" ON "ArchetypeStage"("careerId");

-- CreateIndex
CREATE INDEX "TrainingLog_careerId_idx" ON "TrainingLog"("careerId");

-- CreateIndex
CREATE INDEX "TransferOffer_careerId_idx" ON "TransferOffer"("careerId");

-- CreateIndex
CREATE INDEX "Contract_careerId_idx" ON "Contract"("careerId");

-- CreateIndex
CREATE INDEX "AgentNote_careerId_idx" ON "AgentNote"("careerId");

-- CreateIndex
CREATE INDEX "InjuryLog_careerId_idx" ON "InjuryLog"("careerId");

-- CreateIndex
CREATE INDEX "Suspension_careerId_idx" ON "Suspension"("careerId");

-- CreateIndex
CREATE INDEX "PressNote_careerId_idx" ON "PressNote"("careerId");

-- CreateIndex
CREATE INDEX "Achievement_careerId_idx" ON "Achievement"("careerId");

-- CreateIndex
CREATE INDEX "Achievement_careerId_key_idx" ON "Achievement"("careerId", "key");

-- AddForeignKey
ALTER TABLE "Token" ADD CONSTRAINT "Token_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Career" ADD CONSTRAINT "Career_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_careerId_fkey" FOREIGN KEY ("careerId") REFERENCES "Career"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trophy" ADD CONSTRAINT "Trophy_careerId_fkey" FOREIGN KEY ("careerId") REFERENCES "Career"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeasonChallenge" ADD CONSTRAINT "SeasonChallenge_careerId_fkey" FOREIGN KEY ("careerId") REFERENCES "Career"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NarrativeTag" ADD CONSTRAINT "NarrativeTag_careerId_fkey" FOREIGN KEY ("careerId") REFERENCES "Career"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillSpend" ADD CONSTRAINT "SkillSpend_careerId_fkey" FOREIGN KEY ("careerId") REFERENCES "Career"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttributeTarget" ADD CONSTRAINT "AttributeTarget_careerId_fkey" FOREIGN KEY ("careerId") REFERENCES "Career"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArchetypeStage" ADD CONSTRAINT "ArchetypeStage_careerId_fkey" FOREIGN KEY ("careerId") REFERENCES "Career"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingLog" ADD CONSTRAINT "TrainingLog_careerId_fkey" FOREIGN KEY ("careerId") REFERENCES "Career"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransferOffer" ADD CONSTRAINT "TransferOffer_careerId_fkey" FOREIGN KEY ("careerId") REFERENCES "Career"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_careerId_fkey" FOREIGN KEY ("careerId") REFERENCES "Career"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentNote" ADD CONSTRAINT "AgentNote_careerId_fkey" FOREIGN KEY ("careerId") REFERENCES "Career"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InjuryLog" ADD CONSTRAINT "InjuryLog_careerId_fkey" FOREIGN KEY ("careerId") REFERENCES "Career"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Suspension" ADD CONSTRAINT "Suspension_careerId_fkey" FOREIGN KEY ("careerId") REFERENCES "Career"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PressNote" ADD CONSTRAINT "PressNote_careerId_fkey" FOREIGN KEY ("careerId") REFERENCES "Career"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Achievement" ADD CONSTRAINT "Achievement_careerId_fkey" FOREIGN KEY ("careerId") REFERENCES "Career"("id") ON DELETE CASCADE ON UPDATE CASCADE;
