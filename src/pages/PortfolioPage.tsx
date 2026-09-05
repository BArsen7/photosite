import Gallery from "../components/Gallery";
import Services from "../components/Services";

/** /portfolio — полная сетка работ с фильтрами и лайтбоксом + услуги. */
export default function PortfolioPage() {
  return (
    <div className="pt-20 md:pt-24">
      <Gallery />
      <Services />
    </div>
  );
}
