// app/routes/app.admin.jsx
import React, { useState, useEffect } from 'react';
import {
  Page,
  Card,
  DataTable,
  Filters,
  Button,
  Spinner,
  TextStyle,
  Stack,
  EmptyState,
  Select,
  Pagination,
  Banner
} from '@shopify/polaris';
import { useSubmit, useLoaderData } from '@remix-run/react';
import { json } from '@remix-run/node';
import { authenticate } from '../lib/authenticate.server';
import { connectToDatabase } from '../lib/db.server';
import Image from '../models/Image.server';

export async function loader({ request }) {
  const { shop, session } = await authenticate.admin(request);
  
  if (!shop || !session) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Get query parameters
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get('page') || '1');
  const status = url.searchParams.get('status') || 'all';
  const ITEMS_PER_PAGE = 20;
  
  try {
    await connectToDatabase();
    
    // Build query based on filter
    const query = { shopId: shop.id };
    if (status === 'purchased') {
      query.isPurchased = true;
    } else if (status === 'not-purchased') {
      query.isPurchased =