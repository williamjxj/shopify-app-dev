// app/routes/app._index.jsx
import React, { useState } from 'react';
import { Page, Tabs, Layout } from '@shopify/polaris';

export default function Index() {
  const [selected, setSelected] = useState(0);
  
  const tabs = [
    {
      id: 'generate',
      content: 'Generate',
      panelID: 'generate-content',
    },
    {
      id: 'gallery',
      content: 'Gallery',
      panelID: 'gallery-content',
    },
  ];

  return (
    <Page title="AI Oil Painting Customizer">
      <Tabs tabs={tabs} selected={selected} onSelect={setSelected}>
        <Layout>
          {selected === 0 && <GenerateTab />}
          {selected === 1 && <GalleryTab />}
        </Layout>
      </Tabs>
    </Page>
  );
}