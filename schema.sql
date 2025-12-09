-- Generated SQL Dump for Scorella Production Schema
-- Compatible with PostgreSQL

-- Enums
CREATE TYPE "public"."age_bucket_enum" AS ENUM('U13', '13-15', '16-17', '18+');
CREATE TYPE "public"."video_visibility_enum" AS ENUM('PUBLIC', 'PRIVATE', 'UNLISTED');
CREATE TYPE "public"."moderation_status_enum" AS ENUM('PENDING', 'APPROVED', 'REJECTED', 'FLAGGED');
CREATE TYPE "public"."group_role_enum" AS ENUM('OWNER', 'ADMIN', 'MEMBER');
CREATE TYPE "public"."report_status_enum" AS ENUM('OPEN', 'IN_REVIEW', 'RESOLVED', 'REJECTED');

-- Users Table
CREATE TABLE "user" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "appleId" character varying NOT NULL,
  "email" character varying,
  "displayName" character varying,
  "bio" character varying,
  "ageBucket" "public"."age_bucket_enum",
  "isActive" boolean NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  "deletedAt" TIMESTAMP WITH TIME ZONE,
  CONSTRAINT "UQ_appleId" UNIQUE ("appleId"),
  CONSTRAINT "UQ_email" UNIQUE ("email"),
  CONSTRAINT "PK_user" PRIMARY KEY ("id")
);
CREATE INDEX "IDX_user_ageBucket" ON "user" ("ageBucket");

-- Parental Consents
CREATE TABLE "parental_consents" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "childUserId" uuid NOT NULL,
  "parentContact" character varying NOT NULL,
  "verificationMethod" character varying NOT NULL,
  "status" character varying NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  "revokedAt" TIMESTAMP WITH TIME ZONE,
  CONSTRAINT "PK_parental_consents" PRIMARY KEY ("id")
);
ALTER TABLE "parental_consents" ADD CONSTRAINT "FK_consent_user" FOREIGN KEY ("childUserId") REFERENCES "user"("id") ON DELETE CASCADE;

-- Videos Table
CREATE TABLE "video" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "userId" uuid NOT NULL,
  "title" character varying,
  "videoUrl" character varying,
  "status" character varying DEFAULT 'processing',
  "visibility" "public"."video_visibility_enum" NOT NULL DEFAULT 'PUBLIC',
  "moderationStatus" "public"."moderation_status_enum" NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  "deletedAt" TIMESTAMP WITH TIME ZONE,
  CONSTRAINT "PK_video" PRIMARY KEY ("id")
);
CREATE INDEX "IDX_video_createdAt" ON "video" ("createdAt" DESC);
ALTER TABLE "video" ADD CONSTRAINT "FK_video_user" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE;

-- Comments Table
CREATE TABLE "comment" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "text" character varying NOT NULL,
  "userId" uuid NOT NULL,
  "videoId" uuid NOT NULL,
  "isVisible" boolean NOT NULL DEFAULT true,
  "moderationStatus" "public"."moderation_status_enum" NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  "deletedAt" TIMESTAMP WITH TIME ZONE,
  CONSTRAINT "PK_comment" PRIMARY KEY ("id")
);
ALTER TABLE "comment" ADD CONSTRAINT "FK_comment_user" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE;
ALTER TABLE "comment" ADD CONSTRAINT "FK_comment_video" FOREIGN KEY ("videoId") REFERENCES "video"("id") ON DELETE CASCADE;

-- Groups Table
CREATE TABLE "group" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "name" character varying NOT NULL,
  "ownerId" uuid NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  "deletedAt" TIMESTAMP WITH TIME ZONE,
  CONSTRAINT "PK_group" PRIMARY KEY ("id")
);
ALTER TABLE "group" ADD CONSTRAINT "FK_group_owner" FOREIGN KEY ("ownerId") REFERENCES "user"("id") ON DELETE CASCADE;

-- Group Members
CREATE TABLE "group_members" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "groupId" uuid NOT NULL,
  "userId" uuid NOT NULL,
  "role" "public"."group_role_enum" NOT NULL DEFAULT 'MEMBER',
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT "PK_group_members" PRIMARY KEY ("id")
);
ALTER TABLE "group_members" ADD CONSTRAINT "FK_member_group" FOREIGN KEY ("groupId") REFERENCES "group"("id") ON DELETE CASCADE;
ALTER TABLE "group_members" ADD CONSTRAINT "FK_member_user" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE;

-- Reports Table
CREATE TABLE "report" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "reporterId" uuid NOT NULL,
  "reportedUserId" uuid,
  "videoId" uuid,
  "reason" character varying NOT NULL,
  "status" "public"."report_status_enum" NOT NULL DEFAULT 'OPEN',
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT "PK_report" PRIMARY KEY ("id")
);
ALTER TABLE "report" ADD CONSTRAINT "FK_report_reporter" FOREIGN KEY ("reporterId") REFERENCES "user"("id") ON DELETE CASCADE;
ALTER TABLE "report" ADD CONSTRAINT "FK_report_reportedUser" FOREIGN KEY ("reportedUserId") REFERENCES "user"("id") ON DELETE CASCADE;
ALTER TABLE "report" ADD CONSTRAINT "FK_report_video" FOREIGN KEY ("videoId") REFERENCES "video"("id") ON DELETE CASCADE;
