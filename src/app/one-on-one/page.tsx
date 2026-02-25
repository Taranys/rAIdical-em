// US-2.14: 1:1 Preparation page — view member data for 1:1 meetings
import { OneOnOneContent } from "./one-on-one-content";

export const dynamic = "force-dynamic";

export default function OneOnOnePage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl print:px-0 print:py-4">
      <OneOnOneContent />
    </div>
  );
}
