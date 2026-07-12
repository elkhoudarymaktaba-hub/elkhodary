import { Phone, Mail, Clock } from 'lucide-react';

export const metadata = {
  title: 'الموقع تحت الصيانة | مكتبة الخضري',
  description: 'الموقع تحت الصيانة حالياً لتحديث المنتجات وباقات المدارس الجديدة. سنعود قريباً!',
};

export default function MaintenancePage() {
  return (
    <div className="fixed inset-0 z-[9999] bg-paper bg-notebook-lines flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-notebook shadow-brand border border-paper-line p-8 md:p-12 text-center relative overflow-hidden">
        
        {/* Decorative elements */}
        <div className="absolute -top-12 -right-12 w-24 h-24 bg-sage/5 rounded-full blur-xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-24 h-24 bg-amber/5 rounded-full blur-xl pointer-events-none" />

        {/* Brand Header */}
        <div className="mb-6 space-y-2">
          <span className="text-3xl font-black text-ink tracking-wide">
            مكتبة <span className="text-coral">الخضري</span>
          </span>
          <div className="h-[3px] w-20 bg-amber mx-auto rounded-full" />
        </div>

        {/* Maintenance message */}
        <h1 className="text-2xl md:text-3xl font-black text-ink mb-4">
          الموقع تحت الصيانة حالياً
        </h1>
        
        <p className="text-ink-soft/75 text-sm md:text-base leading-relaxed mb-8 max-w-lg mx-auto font-medium">
          نعمل الآن على تجهيز باقات ومستلزمات العام الدراسي الجديد وتحديث الأسعار لنمنحكم أفضل تجربة تسوق. سنكون معكم مجدداً خلال وقت قصير جداً!
        </p>

        {/* Quick Contact Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8 bg-paper rounded-2xl border border-paper-line/80 p-6 font-bold text-xs">
          <div className="flex flex-col items-center p-2 space-y-1">
            <div className="w-9 h-9 rounded-xl bg-sage/10 flex items-center justify-center text-sage-deep mb-2 border border-sage/10 shadow-sm">
              <Phone size={16} />
            </div>
            <span className="text-[10px] text-ink-soft/50">الخط الساخن</span>
            <a href="tel:19000" className="text-base font-extrabold text-ink hover:text-coral transition-colors font-numbers">
              19000
            </a>
          </div>

          <div className="flex flex-col items-center p-2 border-t sm:border-t-0 sm:border-r border-paper-line/80 space-y-1">
            <div className="w-9 h-9 rounded-xl bg-coral/10 flex items-center justify-center text-coral-deep mb-2 border border-coral/10 shadow-sm">
              <Mail size={16} />
            </div>
            <span className="text-[10px] text-ink-soft/50">البريد الإلكتروني</span>
            <a href="mailto:info@alkhodary.eg" className="text-xs font-extrabold text-sage-deep hover:text-coral transition-colors font-numbers">
              info@alkhodary.eg
            </a>
          </div>
        </div>

        {/* Footer Note */}
        <div className="flex items-center justify-center gap-2 text-ink-soft/45 text-[10px] font-bold">
          <Clock size={12} className="text-sage" />
          <span>مواعيد خدمة العملاء: يومياً من 9:00 ص إلى 10:00 م</span>
        </div>

      </div>
    </div>
  );
}
