// US-2.07: Review Quality page — view comment classification results
import { ReviewQualityContent } from "./review-quality-content";

export const dynamic = "force-dynamic";

export default function ReviewQualityPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <ReviewQualityContent />
    </div>
  );
}
