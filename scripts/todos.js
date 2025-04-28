#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

process.noDeprecation = true
const { SUPABASE_ANON_KEY: supabaseKey, SUPABASE_URL: supabaseUrl } = process.env

if (!supabaseKey || !supabaseUrl) {
    throw new Error('Missing Supabase credentials')
}

// Create client with the base URL, not with the endpoint appended
const supabase = createClient(supabaseUrl, supabaseKey)

// Query the todos table instead of characters
const { data, error } = await supabase
  .from('todos')
  .select()

if (data) {
    console.log(data)  // Log the data, not the client
}   

if (error) {
  console.error(error)
}