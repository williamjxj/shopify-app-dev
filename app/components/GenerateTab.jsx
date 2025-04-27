// app/components/GenerateTab.jsx
import React, { useState } from 'react';
import {
  Card,
  Button,
  DropZone,
  Stack,
  Caption,
  TextStyle,
  TextField,
  Banner,
  Layout,
  RadioButton,
  Spinner,
  Modal
} from '@shopify/polaris';
import { useNavigate } from '@remix-run/react';

export function GenerateTab() {
  const navigate = useNavigate();
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [selectedStyle, setSelectedStyle] = useState('');
  const [customDetails, setCustomDetails] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleDropZoneDrop = (files) => {
    if (files.length > 0) {
      const file = files[0];
      setImageFile(file);
      
      // Create file preview
      const reader = new FileReader();
      reader.onload = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleStyleChange = (value) => {
    setSelectedStyle(value);
  };

  const handleGenerateArtwork = async () => {
    // Validate inputs
    if (!imageFile) {
      setErrorMessage('Please upload an image');
      return;
    }
    if (!selectedStyle) {
      setErrorMessage('Please select a painting style');
      return;
    }
    
    setIsLoading(true);
    setErrorMessage('');
    
    try {
      // Create form data for API request
      const formData = new FormData();
      formData.append('image', imageFile);
      formData.append('style', selectedStyle);
      formData.append('details', customDetails);
      
      // Make API request to generate artwork
      const response = await fetch('/api/images/generate', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate artwork');
      }
      
      const data = await response.json();
      setGeneratedImage(data.watermarkedImageUrl);
    } catch (error) {
      console.error('Error generating artwork:', error);
      setErrorMessage('An error occurred while generating your artwork. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckout = async () => {
    if (!generatedImage) return;
    
    try {
      const response = await fetch('/api/checkout/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageId: generatedImage.id,
        }),
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

  return (
    <Layout>
      {errorMessage && (
        <Layout.Section>
          <Banner status="critical">{errorMessage}</Banner>
        </Layout.Section>
      )}
      
      <Layout.Section>
        <Card title="Upload your portrait">
          <Card.Section>
            <DropZone
              accept="image/*"
              type="image"
              onDrop={handleDropZoneDrop}
            >
              {imagePreview ? (
                <div style={{ padding: '1rem', textAlign: 'center' }}>
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    style={{ maxWidth: '100%', maxHeight: '300px' }} 
                  />
                </div>
              ) : (
                <DropZone.FileUpload />
              )}
            </DropZone>
          </Card.Section>
        </Card>
      </Layout.Section>

      <Layout.Section>
        <Card title="Choose your oil painting style">
          <Card.Section>
            <Stack vertical>
              <RadioButton
                label="Renaissance"
                checked={selectedStyle === 'renaissance'}
                id="renaissance"
                name="style"
                onChange={() => handleStyleChange('renaissance')}
              />
              <RadioButton
                label="Impressionist"
                checked={selectedStyle === 'impressionist'}
                id="impressionist"
                name="style"
                onChange={() => handleStyleChange('impressionist')}
              />
              <RadioButton
                label="Royal Portrait"
                checked={selectedStyle === 'royal'}
                id="royal"
                name="style"
                onChange={() => handleStyleChange('royal')}
              />
              <RadioButton
                label="Anime Style"
                checked={selectedStyle === 'anime'}
                id="anime"
                name="style"
                onChange={() => handleStyleChange('anime')}
              />
            </Stack>
          </Card.Section>
        </Card>
      </Layout.Section>

      <Layout.Section>
        <Card title="Add details">
          <Card.Section>
            <TextField
              label="Customization details"
              value={customDetails}
              onChange={setCustomDetails}
              placeholder="e.g., smile, background of stars, wearing a classical gown"
              multiline={3}
            />
          </Card.Section>
        </Card>
      </Layout.Section>

      <Layout.Section>
        <Button 
          primary 
          fullWidth 
          onClick={handleGenerateArtwork}
          loading={isLoading}
          disabled={isLoading || !imageFile || !selectedStyle}
        >
          Generate Artwork
        </Button>
      </Layout.Section>

      {generatedImage && (
        <>
          <Layout.Section>
            <Card title="Generated Artwork">
              <Card.Section>
                <div style={{ padding: '1rem', textAlign: 'center' }}>
                  <img 
                    src={generatedImage} 
                    alt="Generated artwork" 
                    style={{ maxWidth: '100%', maxHeight: '400px' }} 
                  />
                </div>
              </Card.Section>
              <Card.Section>
                <Stack distribution="equalSpacing">
                  <Button onClick={() => setGeneratedImage(null)}>
                    Generate again
                  </Button>
                  <Button primary onClick={handleCheckout}>
                    Download
                  </Button>
                </Stack>
              </Card.Section>
            </Card>
          </Layout.Section>
        </>
      )}

      {isLoading && (
        <Modal
          open={isLoading}
          title="Generating your artwork"
          onClose={() => {}}
          primaryAction={null}
        >
          <Modal.Section>
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <Spinner size="large" />
              <div style={{ marginTop: '1rem' }}>
                <TextStyle>Please wait while we create your masterpiece...</TextStyle>
              </div>
            </div>
          </Modal.Section>
        </Modal>
      )}
    </Layout>
  );
}