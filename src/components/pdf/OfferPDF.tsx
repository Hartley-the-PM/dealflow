'use client';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import type { Offer, OfferLine, Product, Customer } from '@/types';

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: 'Helvetica' },
  header: { marginBottom: 20 },
  companyName: { fontSize: 18, fontWeight: 'bold', color: '#002855' },
  companySubtitle: { fontSize: 9, color: '#6B7280', marginTop: 2 },
  divider: { borderBottomWidth: 2, borderBottomColor: '#002855', marginVertical: 12 },
  thinDivider: { borderBottomWidth: 0.5, borderBottomColor: '#E5E7EB', marginVertical: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 12, fontWeight: 'bold', color: '#002855', marginBottom: 8 },
  label: { fontSize: 8, color: '#6B7280', textTransform: 'uppercase', marginBottom: 2 },
  value: { fontSize: 10, marginBottom: 6 },
  table: { marginTop: 8 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#F5F7FA', paddingVertical: 6, paddingHorizontal: 4, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  tableHeaderCell: { fontSize: 8, fontWeight: 'bold', color: '#6B7280', textTransform: 'uppercase' },
  tableRow: { flexDirection: 'row', paddingVertical: 5, paddingHorizontal: 4, borderBottomWidth: 0.5, borderBottomColor: '#F3F4F6' },
  tableCell: { fontSize: 9 },
  col1: { width: '35%' },
  col2: { width: '12%', textAlign: 'right' },
  col3: { width: '10%', textAlign: 'center' },
  col4: { width: '15%', textAlign: 'right' },
  col5: { width: '13%', textAlign: 'right' },
  col6: { width: '15%', textAlign: 'right' },
  footer: { position: 'absolute', bottom: 40, left: 40, right: 40 },
  signatureBlock: { marginTop: 40, flexDirection: 'row', justifyContent: 'space-between' },
  signatureLine: { width: 200, borderBottomWidth: 1, borderBottomColor: '#000', marginTop: 40, marginBottom: 4 },
  signatureLabel: { fontSize: 8, color: '#6B7280' },
  notes: { fontSize: 9, color: '#374151', lineHeight: 1.4 },
  totalRow: { flexDirection: 'row', paddingVertical: 6, paddingHorizontal: 4, backgroundColor: '#F5F7FA', borderTopWidth: 1, borderTopColor: '#E5E7EB' },
  totalLabel: { fontSize: 10, fontWeight: 'bold' },
  totalValue: { fontSize: 10, fontWeight: 'bold' },
});

interface OfferPDFProps {
  offer: Offer;
  customer: Customer;
  products: Product[];
  mspMap: Record<string, number>;
}

export default function OfferPDF({ offer, customer, products, mspMap }: OfferPDFProps) {
  const getProduct = (id: string) => products.find((p) => p.id === id);

  const totalValue = offer.lines.reduce((sum, line) => {
    if (line.quantity) return sum + line.pricePerUnit * line.quantity;
    return sum;
  }, 0);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Company Header */}
        <View style={styles.header}>
          <Text style={styles.companyName}>Vinmar International</Text>
          <Text style={styles.companySubtitle}>Polymer Distribution & Trading</Text>
        </View>
        <View style={styles.divider} />

        {/* Customer & Offer Info */}
        <View style={[styles.row, styles.section]}>
          <View style={{ width: '50%' }}>
            <Text style={styles.label}>Customer</Text>
            <Text style={[styles.value, { fontWeight: 'bold' }]}>{customer.name}</Text>
            <Text style={styles.value}>{customer.address}</Text>
            <Text style={styles.value}>{customer.country}</Text>
          </View>
          <View style={{ width: '45%' }}>
            <Text style={styles.label}>Offer Reference</Text>
            <Text style={[styles.value, { fontWeight: 'bold' }]}>{offer.name}</Text>
            <Text style={styles.label}>Date</Text>
            <Text style={styles.value}>{new Date(offer.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</Text>
            {offer.validityDate && (
              <>
                <Text style={styles.label}>Valid Until</Text>
                <Text style={styles.value}>{new Date(offer.validityDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</Text>
              </>
            )}
          </View>
        </View>

        {/* Terms */}
        <View style={[styles.row, styles.section]}>
          <View style={{ width: '30%' }}>
            <Text style={styles.label}>Incoterms</Text>
            <Text style={styles.value}>{offer.incoterms}{offer.incotermsLocation ? ` – ${offer.incotermsLocation}` : ''}</Text>
          </View>
          <View style={{ width: '30%' }}>
            <Text style={styles.label}>Currency</Text>
            <Text style={styles.value}>{offer.currency}</Text>
          </View>
          {offer.paymentTerms && (
            <View style={{ width: '30%' }}>
              <Text style={styles.label}>Payment Terms</Text>
              <Text style={styles.value}>{offer.paymentTerms}</Text>
            </View>
          )}
        </View>

        <View style={styles.thinDivider} />

        {/* Product Table */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Products</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, styles.col1]}>Product</Text>
              <Text style={[styles.tableHeaderCell, styles.col2]}>Quantity</Text>
              <Text style={[styles.tableHeaderCell, styles.col3]}>Unit</Text>
              <Text style={[styles.tableHeaderCell, styles.col4]}>Price / Unit</Text>
              <Text style={[styles.tableHeaderCell, styles.col5]}>MSP</Text>
              <Text style={[styles.tableHeaderCell, styles.col6]}>Total</Text>
            </View>
            {offer.lines.map((line, i) => {
              const product = getProduct(line.productId);
              const msp = mspMap[line.productId] || 0;
              const lineTotal = line.quantity ? line.pricePerUnit * line.quantity : null;
              return (
                <View key={i} style={styles.tableRow}>
                  <View style={styles.col1}>
                    <Text style={styles.tableCell}>{product?.name || 'Unknown'}</Text>
                    {product?.legacyName && (
                      <Text style={[styles.tableCell, { fontSize: 7, color: '#9CA3AF' }]}>{product.legacyName}</Text>
                    )}
                  </View>
                  <Text style={[styles.tableCell, styles.col2]}>{line.quantity ?? '–'}</Text>
                  <Text style={[styles.tableCell, styles.col3]}>{line.unit}</Text>
                  <Text style={[styles.tableCell, styles.col4]}>
                    {offer.currency === 'USD' ? '$' : '€'}{line.pricePerUnit.toLocaleString()}
                  </Text>
                  <Text style={[styles.tableCell, styles.col5]}>
                    {msp ? `${offer.currency === 'USD' ? '$' : '€'}${msp.toLocaleString()}` : '–'}
                  </Text>
                  <Text style={[styles.tableCell, styles.col6]}>
                    {lineTotal ? `${offer.currency === 'USD' ? '$' : '€'}${lineTotal.toLocaleString()}` : '–'}
                  </Text>
                </View>
              );
            })}
            {totalValue > 0 && (
              <View style={styles.totalRow}>
                <Text style={[styles.totalLabel, styles.col1]}>Total</Text>
                <Text style={[styles.tableCell, styles.col2]} />
                <Text style={[styles.tableCell, styles.col3]} />
                <Text style={[styles.tableCell, styles.col4]} />
                <Text style={[styles.tableCell, styles.col5]} />
                <Text style={[styles.totalValue, styles.col6]}>
                  {offer.currency === 'USD' ? '$' : '€'}{totalValue.toLocaleString()}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Notes */}
        {offer.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes & Special Terms</Text>
            <Text style={styles.notes}>{offer.notes}</Text>
          </View>
        )}

        {/* Signature Block */}
        <View style={styles.signatureBlock}>
          <View>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Authorized Signature (Vinmar)</Text>
          </View>
          <View>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Customer Acceptance</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
