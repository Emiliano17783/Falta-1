export default function CanchasScreen() {
 return (
  <div className="min-h-svh bg-f-bg">
   <div className="border-b border-f-border px-6 md:px-12 pt-10 pb-6"
    style={{ background: '#111' }}>
    <h1 className="text-white font-black uppercase leading-none mb-1"
     style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}>
     Canchas
    </h1>
    <p className="text-f-muted text-base">Montevideo y Flores — fútbol y pádel</p>
   </div>

   <div className="flex flex-col items-center justify-center py-32 px-6 text-center">
    <p className="text-white font-black text-2xl uppercase mb-3">Próximamente</p>
    <p className="text-f-muted text-base leading-relaxed max-w-xs">
     Estamos sumando canchas en Montevideo y Flores. Volvé pronto.
    </p>
   </div>
  </div>
 );
}
