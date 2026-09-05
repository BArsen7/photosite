import Services from "../components/Services";
import Contact from "../components/Contact";

/** /contact — услуги с ценами, затем форма заявки. */
export default function ContactPage() {
  return (
    <div className="pt-20 md:pt-24">
      <Services />
      <Contact />
    </div>
  );
}
