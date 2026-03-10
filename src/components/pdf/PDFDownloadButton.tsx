'use client';
import { useState } from 'react';
import dynamic from 'next/dynamic';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import type { Offer, Customer, Product } from '@/types';

const PDFDownloadLink = dynamic(
  () => import('@react-pdf/renderer').then((mod) => mod.PDFDownloadLink),
  { ssr: false }
);

const OfferPDF = dynamic(() => import('./OfferPDF'), { ssr: false });

interface PDFDownloadButtonProps {
  offer: Offer;
  customer: Customer;
  products: Product[];
  mspMap: Record<string, number>;
  onGenerated?: () => void;
}

export default function PDFDownloadButton({ offer, customer, products, mspMap, onGenerated }: PDFDownloadButtonProps) {
  const [ready, setReady] = useState(false);

  return (
    <PDFDownloadLink
      document={<OfferPDF offer={offer} customer={customer} products={products} mspMap={mspMap} />}
      fileName={`${offer.name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`}
    >
      {({ loading }) => (
        <Button
          variant="outlined"
          startIcon={loading ? <CircularProgress size={16} /> : <PictureAsPdfIcon />}
          disabled={loading}
          onClick={() => onGenerated?.()}
          size="small"
        >
          {loading ? 'Generating...' : 'Download PDF'}
        </Button>
      )}
    </PDFDownloadLink>
  );
}
