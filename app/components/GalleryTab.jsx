// app/components/GalleryTab.jsx
import React, { useState, useEffect } from 'react';
import {
  Card,
  ResourceList,
  Stack,
  TextStyle,
  Thumbnail,
  Button,
  EmptyState,
  Spinner,
  Badge,
  Pagination,
  Select,
  Layout,
  Banner
} from '@shopify/polaris';
import { useNavigate } from '@remix-run/react';

export function GalleryTab() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [images, setImages] = useState([]);
  const [filter, setFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [errorMessage, setErrorMessage] = useState('');

  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    fetchImages();
  }, [currentPage, filter]);

  const fetchImages = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/images/list?page=${currentPage}&filter=${filter}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch images');
      }
      
      const data = await response.json();
      setImages(data.images);
      setTotalPages(Math.ceil(data.total / ITEMS_PER_PAGE));
    } catch (error) {
      console.error('Error fetching images:', error);
      setErrorMessage('Failed to load your gallery. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckout = async (imageId) => {
    try {
      const response = await fetch('/api/checkout/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageId }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create checkout');
      }
      
      const { checkoutUrl } = await response.json();
      window.top.location.href = checkoutUrl;
    } catch (error) {
      console.error('Error creating checkout:', error);
      setErrorMessage('Failed to create checkout. Please try again.');
    }
  };

  const handleDownload = async (imageId) => {
    window.open(`/api/images/download/${imageId}`, '_blank');
  };

  const handleFilterChange = (value) => {
    setFilter(value);
    setCurrentPage(1);
  };

  const renderItem = (image) => {
    const { id, watermarkedImageUrl, styleSelected, customizationDetails, isPurchased, createdAt } = image;
    const date = new Date(createdAt).toLocaleDateString();
    
    return (
      <ResourceList.Item id={id}>
        <Stack alignment="center">
          <Stack.Item>
            <Thumbnail
              source={watermarkedImageUrl}
              alt={`Generated ${styleSelected} style image`}
              size="large"
            />
          </Stack.Item>
          
          <Stack.Item fill>
            <Stack vertical spacing="tight">
              <TextStyle variation="strong">{styleSelected} Style</TextStyle>
              {customizationDetails && (
                <TextStyle variation="subdued">{customizationDetails}</TextStyle>
              )}
              <TextStyle variation="subdued">Created: {date}</TextStyle>
            </Stack>
          </Stack.Item>
          
          <Stack.Item>
            <Stack alignment="center" spacing="tight">
              {isPurchased ? (
                <>
                  <Badge status="success">Purchased</Badge>
                  <Button onClick={() => handleDownload(id)}>Download</Button>
                </>
              ) : (
                <>
                  <Badge>Watermarked</Badge>
                  <Button primary onClick={() => handleCheckout(id)}>
                    Purchase
                  </Button>
                </>
              )}
            </Stack>
          </Stack.Item>
        </Stack>
      </ResourceList.Item>
    );
  };

  return (
    <Layout>
      {errorMessage && (
        <Layout.Section>
          <Banner status="critical">{errorMessage}</Banner>
        </Layout.Section>
      )}
      
      <Layout.Section>
        <Card>
          <Card.Section>
            <Stack distribution="equalSpacing" alignment="center">
              <TextStyle variation="strong">Your Generated Artwork</TextStyle>
              <Select
                label="Filter"
                labelInline
                options={[
                  { label: 'All images', value: 'all' },
                  { label: 'Purchased', value: 'purchased' },
                  { label: 'Not purchased', value: 'not-purchased' },
                ]}
                value={filter}
                onChange={handleFilterChange}
              />
            </Stack>
          </Card.Section>
          
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <Spinner size="large" />
            </div>
          ) : images.length === 0 ? (
            <Card.Section>
              <EmptyState
                heading="No images found"
                image=""
                action={{
                  content: 'Generate new artwork',
                  onAction: () => navigate('/app')
                }}
              >
                <p>Generate your first AI oil painting to see it here.</p>
              </EmptyState>
            </Card.Section>
          ) : (
            <>
              <ResourceList
                items={images}
                renderItem={renderItem}
              />
              
              {totalPages > 1 && (
                <Card.Section>
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <Pagination
                      hasPrevious={currentPage > 1}
                      onPrevious={() => setCurrentPage(p => p - 1)}
                      hasNext={currentPage < totalPages}
                      onNext={() => setCurrentPage(p => p + 1)}
                    />
                  </div>
                </Card.Section>
              )}
            </>
          )}
        </Card>
      </Layout.Section>
    </Layout>
  );
}