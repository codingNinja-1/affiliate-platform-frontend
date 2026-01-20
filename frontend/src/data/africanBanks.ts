export type Bank = {
  name: string;
  code: string;
  country: string;
};

export const africanBanks: Bank[] = [
  // Nigeria
  { name: 'Access Bank', code: '044', country: 'Nigeria' },
  { name: 'Citibank Nigeria', code: '023', country: 'Nigeria' },
  { name: 'Ecobank Nigeria', code: '050', country: 'Nigeria' },
  { name: 'Fidelity Bank', code: '070', country: 'Nigeria' },
  { name: 'First Bank of Nigeria', code: '011', country: 'Nigeria' },
  { name: 'First City Monument Bank (FCMB)', code: '214', country: 'Nigeria' },
  { name: 'Guaranty Trust Bank (GTBank)', code: '058', country: 'Nigeria' },
  { name: 'Heritage Bank', code: '030', country: 'Nigeria' },
  { name: 'Keystone Bank', code: '082', country: 'Nigeria' },
  { name: 'Polaris Bank', code: '076', country: 'Nigeria' },
  { name: 'Providus Bank', code: '101', country: 'Nigeria' },
  { name: 'Stanbic IBTC Bank', code: '221', country: 'Nigeria' },
  { name: 'Standard Chartered Bank', code: '068', country: 'Nigeria' },
  { name: 'Sterling Bank', code: '232', country: 'Nigeria' },
  { name: 'Suntrust Bank', code: '100', country: 'Nigeria' },
  { name: 'Union Bank of Nigeria', code: '032', country: 'Nigeria' },
  { name: 'United Bank for Africa (UBA)', code: '033', country: 'Nigeria' },
  { name: 'Unity Bank', code: '215', country: 'Nigeria' },
  { name: 'Wema Bank', code: '035', country: 'Nigeria' },
  { name: 'Zenith Bank', code: '057', country: 'Nigeria' },
  { name: 'Kuda Bank', code: '090267', country: 'Nigeria' },
  { name: 'Opay', code: '999992', country: 'Nigeria' },
  { name: 'PalmPay', code: '999991', country: 'Nigeria' },
  { name: 'Moniepoint', code: '50515', country: 'Nigeria' },
  { name: 'VFD Microfinance Bank', code: '090110', country: 'Nigeria' },
  { name: 'Rubies Microfinance Bank', code: '090175', country: 'Nigeria' },
  
  // Kenya
  { name: 'Absa Bank Kenya', code: 'ABSA', country: 'Kenya' },
  { name: 'Bank of Africa Kenya', code: 'BOA', country: 'Kenya' },
  { name: 'Bank of Baroda Kenya', code: 'BOB', country: 'Kenya' },
  { name: 'Bank of India', code: 'BOI', country: 'Kenya' },
  { name: 'Citibank Kenya', code: 'CITI', country: 'Kenya' },
  { name: 'Consolidated Bank of Kenya', code: 'CBK', country: 'Kenya' },
  { name: 'Co-operative Bank of Kenya', code: 'COOP', country: 'Kenya' },
  { name: 'Diamond Trust Bank Kenya', code: 'DTB', country: 'Kenya' },
  { name: 'Ecobank Kenya', code: 'ECO', country: 'Kenya' },
  { name: 'Equity Bank Kenya', code: 'EQUITY', country: 'Kenya' },
  { name: 'Family Bank', code: 'FAMILY', country: 'Kenya' },
  { name: 'Guaranty Trust Bank Kenya', code: 'GTB', country: 'Kenya' },
  { name: 'Gulf African Bank', code: 'GAB', country: 'Kenya' },
  { name: 'I&M Bank Kenya', code: 'I&M', country: 'Kenya' },
  { name: 'Kenya Commercial Bank (KCB)', code: 'KCB', country: 'Kenya' },
  { name: 'M-Pesa (Safaricom)', code: 'MPESA', country: 'Kenya' },
  { name: 'National Bank of Kenya', code: 'NBK', country: 'Kenya' },
  { name: 'NCBA Bank Kenya', code: 'NCBA', country: 'Kenya' },
  { name: 'Paramount Bank', code: 'PARAMOUNT', country: 'Kenya' },
  { name: 'Stanbic Bank Kenya', code: 'STANBIC', country: 'Kenya' },
  { name: 'Standard Chartered Kenya', code: 'SCB', country: 'Kenya' },
  { name: 'United Bank for Africa Kenya', code: 'UBA', country: 'Kenya' },
  
  // South Africa
  { name: 'ABSA Bank South Africa', code: 'ABSA', country: 'South Africa' },
  { name: 'African Bank', code: 'AFRICAN', country: 'South Africa' },
  { name: 'Bidvest Bank', code: 'BIDVEST', country: 'South Africa' },
  { name: 'Capitec Bank', code: 'CAPITEC', country: 'South Africa' },
  { name: 'Discovery Bank', code: 'DISCOVERY', country: 'South Africa' },
  { name: 'First National Bank (FNB)', code: 'FNB', country: 'South Africa' },
  { name: 'Investec Bank', code: 'INVESTEC', country: 'South Africa' },
  { name: 'Nedbank', code: 'NEDBANK', country: 'South Africa' },
  { name: 'Standard Bank South Africa', code: 'STANDARD', country: 'South Africa' },
  { name: 'TymeBank', code: 'TYME', country: 'South Africa' },
  
  // Ghana
  { name: 'Access Bank Ghana', code: 'ACCESS', country: 'Ghana' },
  { name: 'Agricultural Development Bank', code: 'ADB', country: 'Ghana' },
  { name: 'Bank of Africa Ghana', code: 'BOA', country: 'Ghana' },
  { name: 'CalBank', code: 'CAL', country: 'Ghana' },
  { name: 'Ecobank Ghana', code: 'ECO', country: 'Ghana' },
  { name: 'Fidelity Bank Ghana', code: 'FIDELITY', country: 'Ghana' },
  { name: 'First Atlantic Bank', code: 'FAB', country: 'Ghana' },
  { name: 'First National Bank Ghana', code: 'FNB', country: 'Ghana' },
  { name: 'GCB Bank', code: 'GCB', country: 'Ghana' },
  { name: 'Guaranty Trust Bank Ghana', code: 'GTB', country: 'Ghana' },
  { name: 'National Investment Bank', code: 'NIB', country: 'Ghana' },
  { name: 'Republic Bank Ghana', code: 'REPUBLIC', country: 'Ghana' },
  { name: 'Stanbic Bank Ghana', code: 'STANBIC', country: 'Ghana' },
  { name: 'Standard Chartered Bank Ghana', code: 'SCB', country: 'Ghana' },
  { name: 'United Bank for Africa Ghana', code: 'UBA', country: 'Ghana' },
  { name: 'Zenith Bank Ghana', code: 'ZENITH', country: 'Ghana' },
  
  // Egypt
  { name: 'Arab African International Bank', code: 'AAIB', country: 'Egypt' },
  { name: 'Arab Banking Corporation Egypt', code: 'ABC', country: 'Egypt' },
  { name: 'Bank of Alexandria', code: 'ALEX', country: 'Egypt' },
  { name: 'Banque Misr', code: 'MISR', country: 'Egypt' },
  { name: 'Commercial International Bank (CIB)', code: 'CIB', country: 'Egypt' },
  { name: 'Credit Agricole Egypt', code: 'CAE', country: 'Egypt' },
  { name: 'Egyptian Gulf Bank', code: 'EGB', country: 'Egypt' },
  { name: 'Faisal Islamic Bank of Egypt', code: 'FAISAL', country: 'Egypt' },
  { name: 'National Bank of Egypt', code: 'NBE', country: 'Egypt' },
  { name: 'QNB Alahli', code: 'QNB', country: 'Egypt' },
  
  // Tanzania
  { name: 'CRDB Bank', code: 'CRDB', country: 'Tanzania' },
  { name: 'Equity Bank Tanzania', code: 'EQUITY', country: 'Tanzania' },
  { name: 'Exim Bank Tanzania', code: 'EXIM', country: 'Tanzania' },
  { name: 'National Microfinance Bank (NMB)', code: 'NMB', country: 'Tanzania' },
  { name: 'Standard Chartered Tanzania', code: 'SCB', country: 'Tanzania' },
  { name: 'Stanbic Bank Tanzania', code: 'STANBIC', country: 'Tanzania' },
  
  // Uganda
  { name: 'Absa Bank Uganda', code: 'ABSA', country: 'Uganda' },
  { name: 'Bank of Africa Uganda', code: 'BOA', country: 'Uganda' },
  { name: 'Centenary Bank', code: 'CENTENARY', country: 'Uganda' },
  { name: 'Dfcu Bank', code: 'DFCU', country: 'Uganda' },
  { name: 'Equity Bank Uganda', code: 'EQUITY', country: 'Uganda' },
  { name: 'Housing Finance Bank', code: 'HFB', country: 'Uganda' },
  { name: 'Stanbic Bank Uganda', code: 'STANBIC', country: 'Uganda' },
  { name: 'Standard Chartered Uganda', code: 'SCB', country: 'Uganda' },
  
  // Rwanda
  { name: 'Access Bank Rwanda', code: 'ACCESS', country: 'Rwanda' },
  { name: 'Bank of Kigali', code: 'BK', country: 'Rwanda' },
  { name: 'Equity Bank Rwanda', code: 'EQUITY', country: 'Rwanda' },
  { name: 'I&M Bank Rwanda', code: 'I&M', country: 'Rwanda' },
  
  // Morocco
  { name: 'Attijariwafa Bank', code: 'ATTIJARIWAFA', country: 'Morocco' },
  { name: 'Banque Centrale Populaire', code: 'BCP', country: 'Morocco' },
  { name: 'BMCE Bank of Africa', code: 'BMCE', country: 'Morocco' },
  { name: 'CIH Bank', code: 'CIH', country: 'Morocco' },
  { name: 'Crédit du Maroc', code: 'CDM', country: 'Morocco' },
  { name: 'Société Générale Maroc', code: 'SGMA', country: 'Morocco' },
  
  // Côte d\'Ivoire
  { name: 'Bank of Africa Côte d\'Ivoire', code: 'BOA', country: 'Côte d\'Ivoire' },
  { name: 'Ecobank Côte d\'Ivoire', code: 'ECO', country: 'Côte d\'Ivoire' },
  { name: 'Société Générale Côte d\'Ivoire', code: 'SGCI', country: 'Côte d\'Ivoire' },
  
  // Senegal
  { name: 'Bank of Africa Senegal', code: 'BOA', country: 'Senegal' },
  { name: 'Ecobank Senegal', code: 'ECO', country: 'Senegal' },
  { name: 'Société Générale Sénégal', code: 'SGS', country: 'Senegal' },
  
  // Ethiopia
  { name: 'Awash Bank', code: 'AWASH', country: 'Ethiopia' },
  { name: 'Bank of Abyssinia', code: 'BOA', country: 'Ethiopia' },
  { name: 'Commercial Bank of Ethiopia', code: 'CBE', country: 'Ethiopia' },
  { name: 'Dashen Bank', code: 'DASHEN', country: 'Ethiopia' },
  
  // Zimbabwe
  { name: 'CBZ Bank', code: 'CBZ', country: 'Zimbabwe' },
  { name: 'Ecobank Zimbabwe', code: 'ECO', country: 'Zimbabwe' },
  { name: 'FBC Bank', code: 'FBC', country: 'Zimbabwe' },
  { name: 'Stanbic Bank Zimbabwe', code: 'STANBIC', country: 'Zimbabwe' },
  
  // Zambia
  { name: 'Access Bank Zambia', code: 'ACCESS', country: 'Zambia' },
  { name: 'Stanbic Bank Zambia', code: 'STANBIC', country: 'Zambia' },
  { name: 'Zanaco', code: 'ZANACO', country: 'Zambia' },
];

// Group banks by country for easier filtering
export const banksByCountry = africanBanks.reduce((acc, bank) => {
  if (!acc[bank.country]) {
    acc[bank.country] = [];
  }
  acc[bank.country].push(bank);
  return acc;
}, {} as Record<string, Bank[]>);

// Get unique countries
export const countries = Array.from(new Set(africanBanks.map(b => b.country))).sort();
