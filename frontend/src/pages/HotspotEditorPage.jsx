import React from 'react';
import HotspotEditor from '../components/HotspotEditor.jsx';

/**
 * Route shell for `/seller/listing/:listingId/room/:roomId/hotspots`.
 * Listing and room are loaded inside HotspotEditor via useParams.
 */
export default function HotspotEditorPage() {
  return <HotspotEditor />;
}
