import { Fish } from "lucide-react";
export default function CatchesPage() {
  return (
    <section className="card empty-page">
      <Fish size={44} />
      <span className="kicker">YOUR CATCH LOG</span>
      <h2>Keep the story behind every catch</h2>
      <p>
        Catch logging follows the map and forecast phase, with weather snapshots
        attached to each record.
      </p>
    </section>
  );
}
