import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function main() {
  const { data, error } = await supabase.auth.signUp({
    email: "mgttechware@gmail.com",
    password: "Cronaldo7707",
  });

  if (error) {
    console.error("Failed to create user:", error.message);
    process.exit(1);
  }

  console.log("Admin user created successfully!");
  console.log("User ID:", data.user?.id);
}

main();
