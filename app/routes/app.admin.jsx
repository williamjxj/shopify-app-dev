import React, { useState, useEffect } from 'react';
import {
  Page,
  Card,
  DataTable,
  Button,
  Spinner,
  EmptyState,
  Select,
  Pagination,
  Banner,
  Box,
  InlineStack,
  BlockStack,
  Text
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
      query.isPurchased = false;
    }
    
    // Get total count for pagination
    const totalCount = await Image.countDocuments(query);
    const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
    
    // Get images for current page
    const images = await Image.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * ITEMS_PER_PAGE)
      .limit(ITEMS_PER_PAGE);
    
    return json({
      images,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: totalCount
      },
      status
    });
  } catch (error) {
    console.error('Error fetching images:', error);
    return json({ error: 'Failed to fetch images' }, { status: 500 });
  }
}

export default function AdminPage() {
  const loaderData = useLoaderData();
  const submit = useSubmit();
  const [filterStatus, setFilterStatus] = useState(loaderData.status || 'all');
  const [isLoading, setIsLoading] = useState(false);
  
  const { images = [], pagination = {}, error } = loaderData;
  const { currentPage = 1, totalPages = 1 } = pagination;
  
  const handleStatusChange = (value) => {
    setFilterStatus(value);
    setIsLoading(true);
    submit({ status: value, page: '1' }, { method: 'get' });
  };
  
  const handlePageChange = (page) => {
    setIsLoading(true);
    submit({ status: filterStatus, page: page.toString() }, { method: 'get' });
  };
  
  useEffect(() => {
    setIsLoading(false);
  }, [images]);
  
  const statusOptions = [
    { label: 'All', value: 'all' },
    { label: 'Purchased', value: 'purchased' },
    { label: 'Not Purchased', value: 'not-purchased' }
  ];
  
  const rows = images.map((image) => [
    <img 
      src={image.url} 
      alt={image.alt || 'Product image'} 
      style={{ width: '50px', height: '50px', objectFit: 'cover' }} 
    />,
    image.title || 'Untitled',
    image.isPurchased ? (
      <Text as="span" tone="success">Purchased</Text>
    ) : (
      <Text as="span" tone="critical">Not Purchased</Text>
    ),
    new Date(image.createdAt).toLocaleDateString(),
    <Button 
      url={`/app/images/${image._id}`} 
      size="slim"
    >
      View Details
    </Button>
  ]);
  
  return (
    <Page
      title="Image Management"
      subtitle="View and manage all product images"
      primaryAction={
        <Button primary url="/app/images/new">Add New Image</Button>
      }
    >
      {error && (
        <Banner status="critical">
          <p>There was an error loading the images: {error}</p>
        </Banner>
      )}
      
      <Card>
        <Card.Section>
          <BlockStack gap="4">
            <Select
              label="Filter by status"
              options={statusOptions}
              value={filterStatus}
              onChange={handleStatusChange}
            />
          </BlockStack>
        </Card.Section>
        
        <Card.Section>
          {isLoading ? (
            <Box paddingBlock="5" textAlign="center">
              <Spinner size="large" />
            </Box>
          ) : images.length === 0 ? (
            <EmptyState
              heading="No images found"
              image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
            >
              <p>
                {filterStatus === 'all' 
                  ? "You haven't uploaded any images yet."
                  : `No ${filterStatus} images found.`}
              </p>
              <Button primary url="/app/images/new">
                Upload Image
              </Button>
            </EmptyState>
          ) : (
            <DataTable
              columnContentTypes={['text', 'text', 'text', 'text', 'text']}
              headings={['Preview', 'Title', 'Status', 'Date Added', 'Actions']}
              rows={rows}
            />
          )}
        </Card.Section>
        
        {totalPages > 1 && (
          <Card.Section>
            <Box textAlign="center">
              <Pagination
                hasPrevious={currentPage > 1}
                onPrevious={() => handlePageChange(currentPage - 1)}
                hasNext={currentPage < totalPages}
                onNext={() => handlePageChange(currentPage + 1)}
              />
            </Box>
          </Card.Section>
        )}
      </Card>
    </Page>
  );
}