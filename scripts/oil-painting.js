#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import assert from 'assert';
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

// Get current file directory in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

process.noDeprecation = true
const { SUPABASE_ANON_KEY: supabaseKey, SUPABASE_URL: supabaseUrl } = process.env

if (!supabaseKey || !supabaseUrl) {
  throw new Error('Missing Supabase credentials')
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Test data
const testEmail = `test-${Date.now()}@example.com`;
let testUserId = null;
let testStyleId = null;
let testProjectId = null;

// Mock image data (for testing purposes)
const mockImagePath = path.join(__dirname, 'public/assets', 'test-image.jpg');
const mockImageBuffer = Buffer.from('Mock image data'); // In real test, use actual image file

async function runTests() {
  console.log('Starting Supabase schema tests for Oil Painting app...');
  
  try {
    // Test 1: Check if painting_styles table has been populated
    await testPaintingStyles();
    
    // Test 2: Create a new user
    await testCreateUser();
    
    // Test 3: Create a new artwork project
    await testCreateArtworkProject();
    
    // Test 4: Update artwork project with generated image
    await testUpdateWithGeneratedImage();
    
    // Test 5: Query artwork projects for a user
    await testQueryUserProjects();
    
    // Cleanup: Delete test data
    await cleanup();
    
    console.log('All tests completed successfully! ✅');
  } catch (error) {
    console.error('Test failed:', error.message);
    await cleanup();
    process.exit(1);
  }
}

async function testPaintingStyles() {
  console.log('\n🧪 Testing painting styles...');
  
  const { data: styles, error } = await supabase
    .from('painting_styles')
    .select('*');
    
  assert.strictEqual(error, null, 'Error fetching painting styles');
  assert.ok(styles.length >= 4, 'Expected at least 4 predefined painting styles');
  
  console.log(`Found ${styles.length} painting styles`);
  testStyleId = styles[0].id; // Store first style ID for later tests
  console.log('✅ Painting styles test passed');
}

async function testCreateUser() {
  console.log('\n🧪 Testing user creation...');
  
  // Create a test user
  const { data: user, error } = await supabase
    .from('users')
    .insert([{ email: testEmail }])
    .select()
    .single();
  
  assert.strictEqual(error, null, 'Error creating user');
  assert.strictEqual(user.email, testEmail, 'Email mismatch');
  assert.ok(user.id, 'User ID should be generated');
  
  testUserId = user.id;
  console.log(`Created test user with ID: ${testUserId}`);
  console.log('✅ User creation test passed');
}

async function testCreateArtworkProject() {
  console.log('\n🧪 Testing artwork project creation...');
  
  // Mock S3 data (in a real app, you'd upload to S3 first)
  const mockS3Key = `uploads/${testUserId}/${Date.now()}.jpg`;
  const mockS3Url = `https://your-bucket.s3.amazonaws.com/${mockS3Key}`;
  
  const newProject = {
    user_id: testUserId,
    style_id: testStyleId,
    custom_details: 'Test project with custom details',
    original_image_s3_key: mockS3Key,
    original_image_s3_url: mockS3Url,
    original_image_filename: 'test-image.jpg',
    original_image_size: mockImageBuffer.length,
    original_image_mime_type: 'image/jpeg',
    original_image_width: 800,
    original_image_height: 600,
    original_thumbnail_base64: 'data:image/jpeg;base64,/9j/mock-data', // Mock thumbnail
    original_thumbnail_width: 100,
    original_thumbnail_height: 75
  };
  
  const { data: project, error } = await supabase
    .from('artwork_projects')
    .insert([newProject])
    .select()
    .single();
  
  assert.strictEqual(error, null, 'Error creating artwork project');
  assert.strictEqual(project.user_id, testUserId, 'User ID mismatch');
  assert.strictEqual(project.style_id, testStyleId, 'Style ID mismatch');
  assert.strictEqual(project.is_generated, false, 'New project should not be marked as generated');
  
  testProjectId = project.id;
  console.log(`Created test project with ID: ${testProjectId}`);
  console.log('✅ Artwork project creation test passed');
}

async function testUpdateWithGeneratedImage() {
  console.log('\n🧪 Testing artwork project update with generated image...');
  
  // Mock generated image data
  const mockGeneratedS3Key = `generated/${testUserId}/${Date.now()}.jpg`;
  const mockGeneratedS3Url = `https://your-bucket.s3.amazonaws.com/${mockGeneratedS3Key}`;
  
  const updateData = {
    generated_image_s3_key: mockGeneratedS3Key,
    generated_image_s3_url: mockGeneratedS3Url,
    generated_image_size: 12345,
    generated_image_width: 1024,
    generated_image_height: 768,
    generated_thumbnail_base64: 'data:image/jpeg;base64,/9j/mock-generated', // Mock thumbnail
    generated_thumbnail_width: 128,
    generated_thumbnail_height: 96,
    is_generated: true,
    generation_date: new Date().toISOString(),
    processing_time: 3500, // 3.5 seconds
    generation_parameters: { 
      prompt: 'Renaissance style portrait', 
      strength: 0.8,
      guidance_scale: 7.5 
    }
  };
  
  const { data: updatedProject, error } = await supabase
    .from('artwork_projects')
    .update(updateData)
    .eq('id', testProjectId)
    .select()
    .single();
  
  assert.strictEqual(error, null, 'Error updating artwork project');
  assert.strictEqual(updatedProject.is_generated, true, 'Project should be marked as generated');
  assert.strictEqual(updatedProject.generated_image_s3_url, mockGeneratedS3Url, 'Generated image URL mismatch');
  
  console.log('✅ Artwork project update test passed');
}

async function testQueryUserProjects() {
  console.log('\n🧪 Testing user projects query...');
  
  // Query all projects for the test user
  const { data: projects, error } = await supabase
    .from('artwork_projects')
    .select(`
      *,
      style:painting_styles(name, description)
    `)
    .eq('user_id', testUserId)
    .order('created_at', { ascending: false });
  
  assert.strictEqual(error, null, 'Error querying user projects');
  assert.ok(projects.length > 0, 'Should find at least one project');
  assert.ok(projects[0].style, 'Project should have style data');
  
  console.log(`Found ${projects.length} projects for user`);
  console.log('First project style:', projects[0].style.name);
  console.log('✅ User projects query test passed');
}

async function cleanup() {
  console.log('\n🧹 Cleaning up test data...');
  
  // Delete test project
  if (testProjectId) {
    await supabase
      .from('artwork_projects')
      .delete()
      .eq('id', testProjectId);
  }
  
  // Delete test user
  if (testUserId) {
    await supabase
      .from('users')
      .delete()
      .eq('id', testUserId);
  }
  
  console.log('Cleanup completed');
}

// Run all tests
runTests();