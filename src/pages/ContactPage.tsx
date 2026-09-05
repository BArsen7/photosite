import Services from "../components/Services";
import Contact from "../components/Contact";
import { usePageMeta } from "../lib/meta";

/** /contact — услуги с ценами, затем форма заявки. */
export default function ContactPage() {
  usePageMeta({
    title: "Контакты",
    description:
      "Заказать съёмку у Артёма Волкова: портрет, стрит, архитектура, натюрморт, пейзаж. Ответ в течение 24 часов.",
  });

  return (
    <div className="pt-20 md:pt-24">
      <Services />
      <Contact />
    </div>
  );
}
