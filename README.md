# Quant'ho - Finance Manager

**Quant'ho** è una web app moderna per la gestione del regime forfettario italiano, costruita con React, TailwindCSS e Supabase.

## Funzionalità
- **Dashboard**: Panoramica completa di fatturato, tasse stimate, e liquidità.
- **Transazioni**: Gestione entrate/uscite con tag e categorie (Business, Personale, Tasse, INPS).
- **Clienti**: Anagrafica clienti semplice.
- **Debiti Fissi**: Tracciamento spese ricorrenti e abbonamenti.
- **Obiettivi**: Impostazione target di fatturato e budget di spesa.
- **Analisi Fiscale**: Calcolo in tempo reale di imposta sostitutiva e contributi INPS.

## Installazione Locale

1. Clona il repository.
2. Installa le dipendenze:
   ```bash
   npm install
   ```
3. Configura le variabili d'ambiente in `.env`:
   ```
   VITE_SUPABASE_URL=tuo_url_supabase
   VITE_SUPABASE_ANON_KEY=tua_chiave_anon_supabase
   ```
4. Avvia il server di sviluppo:
   ```bash
   npm run dev
   ```

## Pubblicazione (Vercel)

L'app è ottimizzata per Vercel.

1. Committa il codice su un repository GitHub.
2. Collega il repository a Vercel.
3. **Importante**: Nelle impostazioni del progetto su Vercel, aggiungi le variabili d'ambiente:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Premi Deploy.

## Pubblicazione Mobile (Android)
Vedi `deployment_guide.md` per i dettagli su Capacitor.
