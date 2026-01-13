import { getSupabaseClient } from "./supabaseClient"

export type AppUser = {
  id: string
  email: string
  password_hash: string | null
  verified: boolean | null
  verification_token: string | null
  provider: "credentials" | "google" | null
  google_id: string | null
  first_name?: string | null
  last_name?: string | null
  mobile?: string | null
}

export async function findUserByEmail(email: string): Promise<AppUser | null> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from("app_users")
    .select("*")
    .eq("email", email)
    .maybeSingle<AppUser>()

  if (error) {
    console.error("Supabase findUserByEmail error", error)
    throw new Error("Database error")
  }

  return data ?? null
}

export async function createCredentialsUser(params: {
  email: string
  passwordHash: string
  firstName?: string | null
  lastName?: string | null
  mobile?: string | null
}): Promise<void> {
  const supabase = getSupabaseClient()
  const { error } = await supabase.from("app_users").insert({
    email: params.email,
    password_hash: params.passwordHash,
    verified: true,
    verification_token: null,
    provider: "credentials",
    google_id: null,
    first_name: params.firstName ?? null,
    last_name: params.lastName ?? null,
    mobile: params.mobile ?? null,
  })

  if (error) {
    console.error("Supabase createCredentialsUser error", error)
    if (error.code === "23505") {
      throw new Error("DUPLICATE_EMAIL")
    }
    throw new Error(error.message || error.details || "Database error")
  }
}

export async function findUserByVerificationToken(token: string): Promise<AppUser | null> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from("app_users")
    .select("*")
    .eq("verification_token", token)
    .maybeSingle<AppUser>()

  if (error) {
    console.error("Supabase findUserByVerificationToken error", error)
    throw new Error("Database error")
  }
  return data ?? null
}

export async function markUserVerifiedById(id: string): Promise<void> {
  const supabase = getSupabaseClient()
  const { error } = await supabase
    .from("app_users")
    .update({ verified: true, verification_token: null })
    .eq("id", id)

  if (error) {
    console.error("Supabase markUserVerifiedById error", error)
    throw new Error("Database error")
  }
}

export async function setUserOtpTokenById(id: string, token: string | null): Promise<void> {
  const supabase = getSupabaseClient()
  const { error } = await supabase
    .from("app_users")
    .update({ verification_token: token })
    .eq("id", id)

  if (error) {
    console.error("Supabase setUserOtpTokenById error", error)
    throw new Error("Database error")
  }
}

export async function upsertGoogleUser(params: {
  email: string
  googleId: string | null
  emailVerified: boolean
}): Promise<void> {
  const supabase = getSupabaseClient()

  const { data: existing, error: findError } = await supabase
    .from("app_users")
    .select("*")
    .eq("email", params.email)
    .maybeSingle<AppUser>()

  if (findError) {
    console.error("Supabase upsertGoogleUser find error", findError)
    throw new Error("Database error")
  }

  if (!existing) {
    const { error: insertError } = await supabase.from("app_users").insert({
      email: params.email,
      password_hash: null,
      verified: params.emailVerified,
      verification_token: null,
      provider: "google",
      google_id: params.googleId,
    })
    if (insertError) {
      console.error("Supabase upsertGoogleUser insert error", insertError)
      throw new Error("Database error")
    }
  } else {
    const { error: updateError } = await supabase
      .from("app_users")
      .update({
        verified: params.emailVerified,
        verification_token: null,
        provider: "google",
        google_id: params.googleId,
      })
      .eq("id", existing.id)

    if (updateError) {
      console.error("Supabase upsertGoogleUser update error", updateError)
      throw new Error("Database error")
    }
  }
}
