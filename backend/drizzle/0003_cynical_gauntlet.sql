CREATE TABLE "college_boundries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255),
	"code" varchar(255),
	"university_id" uuid,
	"polygon_cords" jsonb,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "college_boundries" ADD CONSTRAINT "college_boundries_university_id_universities_id_fk" FOREIGN KEY ("university_id") REFERENCES "public"."universities"("id") ON DELETE cascade ON UPDATE no action;