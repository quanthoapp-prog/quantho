# Quantho: Protocollo Sicurezza & Disaster Recovery

Questo documento definisce le strategie aziendali per la protezione dei dati e la continuità del servizio Quantho.

## 1. Strategia di Backup (Disaster Recovery)

L'obiettivo è garantire che nessun dato vada perso anche in caso di fallimento totale del fornitore principale (Supabase).

### Backup Esterno Automatico
- **Frequenza**: Giornaliera (ore 03:00 UTC).
- **Destinazione**: Cloudflare R2 / AWS S3 (Bucket indipendente).
- **Metodo**: Supabase Edge Function (`daily-backup`).
- **Formato**: JSON compresso.
- **Ritenzione**: Ultimi 30 giorni.

### Procedura di Ripristino (Emergency Restore)
1. Identificare l'ultimo backup valido dal bucket secondario.
2. Inizializzare un nuovo database PostgreSQL/Supabase.
3. Eseguire lo script `schema.sql` per ricreare la struttura.
4. Eseguire lo script di importazione dati (da sviluppare) per popolare le tabelle dal backup JSON.
5. Aggiornare le variabili d'ambiente (`SUPABASE_URL`, `SUPABASE_ANON_KEY`) nell'app.

---

## 2. Hardening Database (RLS & Privacy)

Tutti i dati devono essere protetti a livello di riga (Row Level Security).

### Policy RLS
- Ogni tabella DEVE avere il flag `ENABLE ROW LEVEL SECURITY`.
- Ogni policy DEVE verificare `auth.uid() = user_id`.
- Nessuna tabella deve essere accessibile pubblicamente.

### Integrità dei Dati
- **Foreign Keys**: Tutte le tabelle collegate devono usare `REFERENCES auth.users` con `ON DELETE CASCADE` o `SET NULL` a seconda della criticità.
- **Triggers**: Il trigger `handle_new_user` garantisce che ogni utente abbia un profilo all'iscrizione.

---

## 3. Gestione Segreti e Chiavi

- **Frontend**: Utilizza esclusivamente `VITE_SUPABASE_ANON_KEY`. Mai inserire la `SERVICE_ROLE_KEY` nel codice client.
- **Backend/Edge Functions**: La `SERVICE_ROLE_KEY` è concessa solo alle funzioni interne protette.
- **Environment Variables**: Gestite tramite il dashboard di Supabase e Vercel, mai hardcoded nel repository.

---

## 4. Audit & Monitoraggio

- **Stripe Webhooks**: Protezione tramite firma del segreto (`STRIPE_WEBHOOK_SECRET`) per evitare falsi pagamenti.
- **Diritto all'Oblio**: Funzione `delete-user-account.ts` già implementata per garantire la cancellazione totale e irreversibile dei dati su richiesta dell'utente (GDPR).
