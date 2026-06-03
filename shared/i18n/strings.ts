/**
 * Flight Drama — UI String Translations
 * Static strings for all translated pages.
 * Dynamic content (articles, categories) is stored in the database.
 */

export type UIStrings = {
  // Navigation
  nav: {
    home: string;
    news: string;
    shorts: string;
    flightLookup: string;
    forum: string;
    newsletter: string;
    ranks: string;
    pro: string;
    lounge: string;
    language: string;
    readIn: string;
  };
  // Common
  common: {
    readMore: string;
    viewAll: string;
    loading: string;
    noResults: string;
    search: string;
    searchPlaceholder: string;
    latestNews: string;
    topStories: string;
    hotStories: string;
    publishedAgo: string;
    views: string;
    minutes: string;
    minRead: string;
    backToNews: string;
    readInEnglish: string;
    autoTranslated: string;
    shareArticle: string;
    listenArticle: string;
    generatingAudio: string;
  };
  // Homepage
  home: {
    heroTitle: string;
    heroSubtitle: string;
    latestStories: string;
    breakingNews: string;
    followUs: string;
    newsletter: {
      title: string;
      subtitle: string;
      placeholder: string;
      button: string;
    };
  };
  // News archive
  news: {
    title: string;
    subtitle: string;
    allCategories: string;
    sortRecent: string;
    sortPopular: string;
    noArticles: string;
    noArticlesDesc: string;
    clearFilters: string;
    trySearching: string;
  };
  // Article page
  article: {
    by: string;
    tags: string;
    relatedArticles: string;
    youMightLike: string;
    onThisDay: string;
    share: string;
    comments: string;
    leaveComment: string;
  };
  // On This Day
  onThisDay: {
    title: string;
    subtitle: string;
    selectDay: string;
    noEvents: string;
    jumpToMonth: string;
    today: string;
    allEvents: string;
    categories: {
      first: string;
      milestone: string;
      incident: string;
      record: string;
    };
  };
  // Tags
  tags: {
    title: string;
    subtitle: string;
    filterPlaceholder: string;
    sortAZ: string;
    sortPopular: string;
    sortRecent: string;
    articles: string;
    noTags: string;
  };
  // 404
  notFound: {
    title: string;
    headline: string;
    description: string;
    returnHome: string;
    browseStories: string;
    didYouKnow: string;
    squawkFact: string;
  };
};

export const STRINGS: Record<string, UIStrings> = {
  en: {
    nav: {
      home: 'Home', news: 'News', shorts: 'Shorts', flightLookup: 'Flight Lookup',
      forum: 'Forum', newsletter: 'Newsletter', ranks: 'Ranks', pro: 'Pro',
      lounge: 'Lounge', language: 'Language', readIn: 'Read in',
    },
    common: {
      readMore: 'Read more', viewAll: 'View all', loading: 'Loading…',
      noResults: 'No results found', search: 'Search', searchPlaceholder: 'Search aviation news…',
      latestNews: 'Latest News', topStories: 'Top Stories', hotStories: 'Hot',
      publishedAgo: 'ago', views: 'views', minutes: 'min', minRead: 'min read',
      backToNews: 'Back to News', readInEnglish: 'Read in English',
      autoTranslated: 'Automatically translated', shareArticle: 'Share this article',
      listenArticle: 'Listen to this article', generatingAudio: 'Generating audio with George…',
    },
    home: {
      heroTitle: 'Flight Drama', heroSubtitle: 'Aviation News',
      latestStories: 'Latest Stories', breakingNews: 'Breaking News',
      followUs: 'Follow Us',
      newsletter: { title: 'Flight Drama Newsletter', subtitle: 'Breaking aviation news, weekly deep dives, and community highlights — straight to your inbox.', placeholder: 'Your email address', button: 'Subscribe' },
    },
    news: {
      title: 'Aviation News', subtitle: 'The latest aviation news, incidents, and stories',
      allCategories: 'All', sortRecent: 'Most Recent', sortPopular: 'Most Viewed',
      noArticles: 'No articles found', noArticlesDesc: 'Try a different category or search term',
      clearFilters: 'Clear all filters', trySearching: 'Try searching for',
    },
    article: {
      by: 'By', tags: 'Tags', relatedArticles: 'Related Articles',
      youMightLike: 'You Might Also Like', onThisDay: 'On This Day',
      share: 'Share', comments: 'Comments', leaveComment: 'Leave a comment',
    },
    onThisDay: {
      title: 'On This Day in Aviation', subtitle: '365 days of aviation history',
      selectDay: 'Select a day on the calendar to see what happened in aviation history.',
      noEvents: 'No recorded aviation events for this day.',
      jumpToMonth: 'Jump to Month', today: 'Today', allEvents: 'All Events',
      categories: { first: 'First', milestone: 'Milestone', incident: 'Incident', record: 'Record' },
    },
    tags: {
      title: 'All Aviation Tags', subtitle: 'Browse articles by topic',
      filterPlaceholder: 'Filter tags…', sortAZ: 'A–Z', sortPopular: 'Most Articles', sortRecent: 'Most Recent',
      articles: 'articles', noTags: 'No tags found',
    },
    notFound: {
      title: '404', headline: 'This Page Has Left The Gate',
      description: 'The page you requested has been moved, deleted, or never existed.',
      returnHome: 'Return To Terminal', browseStories: 'Browse Stories',
      didYouKnow: 'Did You Know?',
      squawkFact: 'Squawk 7700 is the universal aviation emergency transponder code.',
    },
  },

  de: {
    nav: {
      home: 'Startseite', news: 'Nachrichten', shorts: 'Shorts', flightLookup: 'Flugsuche',
      forum: 'Forum', newsletter: 'Newsletter', ranks: 'Ränge', pro: 'Pro',
      lounge: 'Lounge', language: 'Sprache', readIn: 'Lesen auf',
    },
    common: {
      readMore: 'Weiterlesen', viewAll: 'Alle anzeigen', loading: 'Lädt…',
      noResults: 'Keine Ergebnisse gefunden', search: 'Suchen', searchPlaceholder: 'Luftfahrtnachrichten suchen…',
      latestNews: 'Aktuelle Nachrichten', topStories: 'Top-Meldungen', hotStories: 'Beliebt',
      publishedAgo: 'vor', views: 'Aufrufe', minutes: 'Min', minRead: 'Min Lesezeit',
      backToNews: 'Zurück zu Nachrichten', readInEnglish: 'Auf Englisch lesen',
      autoTranslated: 'Automatisch übersetzt', shareArticle: 'Artikel teilen',
      listenArticle: 'Artikel anhören', generatingAudio: 'Audio wird mit George generiert…',
    },
    home: {
      heroTitle: 'Flight Drama', heroSubtitle: 'Luftfahrtnachrichten',
      latestStories: 'Neueste Meldungen', breakingNews: 'Eilmeldung',
      followUs: 'Folgen Sie uns',
      newsletter: { title: 'Flight Drama Newsletter', subtitle: 'Aktuelle Luftfahrtnachrichten, wöchentliche Analysen und Community-Highlights — direkt in Ihren Posteingang.', placeholder: 'Ihre E-Mail-Adresse', button: 'Abonnieren' },
    },
    news: {
      title: 'Luftfahrtnachrichten', subtitle: 'Die neuesten Nachrichten, Zwischenfälle und Berichte aus der Luftfahrt',
      allCategories: 'Alle', sortRecent: 'Neueste', sortPopular: 'Meistgelesen',
      noArticles: 'Keine Artikel gefunden', noArticlesDesc: 'Versuchen Sie eine andere Kategorie oder Suche',
      clearFilters: 'Filter zurücksetzen', trySearching: 'Suchen Sie nach',
    },
    article: {
      by: 'Von', tags: 'Schlagwörter', relatedArticles: 'Verwandte Artikel',
      youMightLike: 'Das könnte Sie auch interessieren', onThisDay: 'Heute in der Geschichte',
      share: 'Teilen', comments: 'Kommentare', leaveComment: 'Kommentar hinterlassen',
    },
    onThisDay: {
      title: 'Heute in der Luftfahrtgeschichte', subtitle: '365 Tage Luftfahrtgeschichte',
      selectDay: 'Wählen Sie einen Tag im Kalender, um zu sehen, was in der Luftfahrtgeschichte passiert ist.',
      noEvents: 'Keine aufgezeichneten Luftfahrtereignisse für diesen Tag.',
      jumpToMonth: 'Zum Monat springen', today: 'Heute', allEvents: 'Alle Ereignisse',
      categories: { first: 'Premiere', milestone: 'Meilenstein', incident: 'Zwischenfall', record: 'Rekord' },
    },
    tags: {
      title: 'Alle Luftfahrt-Schlagwörter', subtitle: 'Artikel nach Thema durchsuchen',
      filterPlaceholder: 'Schlagwörter filtern…', sortAZ: 'A–Z', sortPopular: 'Meiste Artikel', sortRecent: 'Neueste',
      articles: 'Artikel', noTags: 'Keine Schlagwörter gefunden',
    },
    notFound: {
      title: '404', headline: 'Diese Seite hat das Gate verlassen',
      description: 'Die gesuchte Seite wurde verschoben, gelöscht oder existierte nie.',
      returnHome: 'Zurück zum Terminal', browseStories: 'Artikel durchsuchen',
      didYouKnow: 'Wussten Sie?',
      squawkFact: 'Squawk 7700 ist der universelle Notfall-Transponderkode der Luftfahrt.',
    },
  },

  es: {
    nav: {
      home: 'Inicio', news: 'Noticias', shorts: 'Cortos', flightLookup: 'Búsqueda de vuelos',
      forum: 'Foro', newsletter: 'Boletín', ranks: 'Rangos', pro: 'Pro',
      lounge: 'Sala VIP', language: 'Idioma', readIn: 'Leer en',
    },
    common: {
      readMore: 'Leer más', viewAll: 'Ver todo', loading: 'Cargando…',
      noResults: 'No se encontraron resultados', search: 'Buscar', searchPlaceholder: 'Buscar noticias de aviación…',
      latestNews: 'Últimas noticias', topStories: 'Historias destacadas', hotStories: 'Tendencias',
      publishedAgo: 'hace', views: 'vistas', minutes: 'min', minRead: 'min de lectura',
      backToNews: 'Volver a noticias', readInEnglish: 'Leer en inglés',
      autoTranslated: 'Traducido automáticamente', shareArticle: 'Compartir artículo',
      listenArticle: 'Escuchar artículo', generatingAudio: 'Generando audio con George…',
    },
    home: {
      heroTitle: 'Flight Drama', heroSubtitle: 'Noticias de Aviación',
      latestStories: 'Últimas historias', breakingNews: 'Última hora',
      followUs: 'Síguenos',
      newsletter: { title: 'Boletín de Flight Drama', subtitle: 'Noticias de aviación de última hora, análisis semanales y destacados de la comunidad — directo a tu bandeja de entrada.', placeholder: 'Tu correo electrónico', button: 'Suscribirse' },
    },
    news: {
      title: 'Noticias de Aviación', subtitle: 'Las últimas noticias, incidentes e historias de aviación',
      allCategories: 'Todo', sortRecent: 'Más reciente', sortPopular: 'Más visto',
      noArticles: 'No se encontraron artículos', noArticlesDesc: 'Prueba con otra categoría o término de búsqueda',
      clearFilters: 'Borrar filtros', trySearching: 'Intenta buscar',
    },
    article: {
      by: 'Por', tags: 'Etiquetas', relatedArticles: 'Artículos relacionados',
      youMightLike: 'También te puede interesar', onThisDay: 'Hoy en la historia',
      share: 'Compartir', comments: 'Comentarios', leaveComment: 'Dejar un comentario',
    },
    onThisDay: {
      title: 'Hoy en la Historia de la Aviación', subtitle: '365 días de historia de la aviación',
      selectDay: 'Selecciona un día en el calendario para ver qué ocurrió en la historia de la aviación.',
      noEvents: 'No hay eventos de aviación registrados para este día.',
      jumpToMonth: 'Ir al mes', today: 'Hoy', allEvents: 'Todos los eventos',
      categories: { first: 'Primero', milestone: 'Hito', incident: 'Incidente', record: 'Récord' },
    },
    tags: {
      title: 'Todas las etiquetas de aviación', subtitle: 'Explorar artículos por tema',
      filterPlaceholder: 'Filtrar etiquetas…', sortAZ: 'A–Z', sortPopular: 'Más artículos', sortRecent: 'Más reciente',
      articles: 'artículos', noTags: 'No se encontraron etiquetas',
    },
    notFound: {
      title: '404', headline: 'Esta página ha abandonado la puerta',
      description: 'La página que buscas ha sido movida, eliminada o nunca existió.',
      returnHome: 'Volver a la terminal', browseStories: 'Ver artículos',
      didYouKnow: '¿Sabías que?',
      squawkFact: 'Squawk 7700 es el código de emergencia universal del transpondedor de aviación.',
    },
  },

  fr: {
    nav: {
      home: 'Accueil', news: 'Actualités', shorts: 'Shorts', flightLookup: 'Recherche de vol',
      forum: 'Forum', newsletter: 'Newsletter', ranks: 'Rangs', pro: 'Pro',
      lounge: 'Salon', language: 'Langue', readIn: 'Lire en',
    },
    common: {
      readMore: 'Lire la suite', viewAll: 'Tout voir', loading: 'Chargement…',
      noResults: 'Aucun résultat trouvé', search: 'Rechercher', searchPlaceholder: 'Rechercher des actualités aéronautiques…',
      latestNews: 'Dernières actualités', topStories: 'À la une', hotStories: 'Tendances',
      publishedAgo: 'il y a', views: 'vues', minutes: 'min', minRead: 'min de lecture',
      backToNews: 'Retour aux actualités', readInEnglish: 'Lire en anglais',
      autoTranslated: 'Traduit automatiquement', shareArticle: 'Partager cet article',
      listenArticle: 'Écouter cet article', generatingAudio: 'Génération audio avec George…',
    },
    home: {
      heroTitle: 'Flight Drama', heroSubtitle: 'Actualités Aéronautiques',
      latestStories: 'Dernières histoires', breakingNews: 'Dernière heure',
      followUs: 'Suivez-nous',
      newsletter: { title: 'Newsletter Flight Drama', subtitle: 'Actualités aéronautiques en direct, analyses hebdomadaires et temps forts de la communauté — directement dans votre boîte mail.', placeholder: 'Votre adresse e-mail', button: "S'abonner" },
    },
    news: {
      title: 'Actualités Aéronautiques', subtitle: 'Les dernières actualités, incidents et histoires de l\'aviation',
      allCategories: 'Tout', sortRecent: 'Plus récent', sortPopular: 'Plus vu',
      noArticles: 'Aucun article trouvé', noArticlesDesc: 'Essayez une autre catégorie ou terme de recherche',
      clearFilters: 'Effacer les filtres', trySearching: 'Essayez de rechercher',
    },
    article: {
      by: 'Par', tags: 'Étiquettes', relatedArticles: 'Articles connexes',
      youMightLike: 'Vous pourriez aussi aimer', onThisDay: 'Aujourd\'hui dans l\'histoire',
      share: 'Partager', comments: 'Commentaires', leaveComment: 'Laisser un commentaire',
    },
    onThisDay: {
      title: 'Aujourd\'hui dans l\'Histoire de l\'Aviation', subtitle: '365 jours d\'histoire de l\'aviation',
      selectDay: 'Sélectionnez un jour dans le calendrier pour voir ce qui s\'est passé dans l\'histoire de l\'aviation.',
      noEvents: 'Aucun événement aéronautique enregistré pour ce jour.',
      jumpToMonth: 'Aller au mois', today: 'Aujourd\'hui', allEvents: 'Tous les événements',
      categories: { first: 'Première', milestone: 'Étape', incident: 'Incident', record: 'Record' },
    },
    tags: {
      title: 'Toutes les étiquettes aéronautiques', subtitle: 'Parcourir les articles par sujet',
      filterPlaceholder: 'Filtrer les étiquettes…', sortAZ: 'A–Z', sortPopular: 'Plus d\'articles', sortRecent: 'Plus récent',
      articles: 'articles', noTags: 'Aucune étiquette trouvée',
    },
    notFound: {
      title: '404', headline: 'Cette page a quitté la porte d\'embarquement',
      description: 'La page que vous recherchez a été déplacée, supprimée ou n\'a jamais existé.',
      returnHome: 'Retour au terminal', browseStories: 'Parcourir les articles',
      didYouKnow: 'Le saviez-vous ?',
      squawkFact: 'Squawk 7700 est le code d\'urgence universel du transpondeur aéronautique.',
    },
  },

  pt: {
    nav: {
      home: 'Início', news: 'Notícias', shorts: 'Shorts', flightLookup: 'Busca de voos',
      forum: 'Fórum', newsletter: 'Newsletter', ranks: 'Classificações', pro: 'Pro',
      lounge: 'Lounge', language: 'Idioma', readIn: 'Ler em',
    },
    common: {
      readMore: 'Ler mais', viewAll: 'Ver tudo', loading: 'Carregando…',
      noResults: 'Nenhum resultado encontrado', search: 'Buscar', searchPlaceholder: 'Buscar notícias de aviação…',
      latestNews: 'Últimas notícias', topStories: 'Destaques', hotStories: 'Em alta',
      publishedAgo: 'há', views: 'visualizações', minutes: 'min', minRead: 'min de leitura',
      backToNews: 'Voltar para notícias', readInEnglish: 'Ler em inglês',
      autoTranslated: 'Traduzido automaticamente', shareArticle: 'Compartilhar artigo',
      listenArticle: 'Ouvir artigo', generatingAudio: 'Gerando áudio com George…',
    },
    home: {
      heroTitle: 'Flight Drama', heroSubtitle: 'Notícias de Aviação',
      latestStories: 'Últimas histórias', breakingNews: 'Urgente',
      followUs: 'Siga-nos',
      newsletter: { title: 'Newsletter Flight Drama', subtitle: 'Notícias urgentes de aviação, análises semanais e destaques da comunidade — direto para sua caixa de entrada.', placeholder: 'Seu endereço de e-mail', button: 'Inscrever-se' },
    },
    news: {
      title: 'Notícias de Aviação', subtitle: 'As últimas notícias, incidentes e histórias da aviação',
      allCategories: 'Tudo', sortRecent: 'Mais recente', sortPopular: 'Mais visto',
      noArticles: 'Nenhum artigo encontrado', noArticlesDesc: 'Tente outra categoria ou termo de busca',
      clearFilters: 'Limpar filtros', trySearching: 'Tente buscar',
    },
    article: {
      by: 'Por', tags: 'Tags', relatedArticles: 'Artigos relacionados',
      youMightLike: 'Você também pode gostar', onThisDay: 'Hoje na história',
      share: 'Compartilhar', comments: 'Comentários', leaveComment: 'Deixar um comentário',
    },
    onThisDay: {
      title: 'Hoje na História da Aviação', subtitle: '365 dias de história da aviação',
      selectDay: 'Selecione um dia no calendário para ver o que aconteceu na história da aviação.',
      noEvents: 'Nenhum evento de aviação registrado para este dia.',
      jumpToMonth: 'Ir para o mês', today: 'Hoje', allEvents: 'Todos os eventos',
      categories: { first: 'Primeiro', milestone: 'Marco', incident: 'Incidente', record: 'Recorde' },
    },
    tags: {
      title: 'Todas as tags de aviação', subtitle: 'Explorar artigos por tópico',
      filterPlaceholder: 'Filtrar tags…', sortAZ: 'A–Z', sortPopular: 'Mais artigos', sortRecent: 'Mais recente',
      articles: 'artigos', noTags: 'Nenhuma tag encontrada',
    },
    notFound: {
      title: '404', headline: 'Esta página deixou o portão',
      description: 'A página que você procura foi movida, excluída ou nunca existiu.',
      returnHome: 'Voltar ao terminal', browseStories: 'Ver artigos',
      didYouKnow: 'Você sabia?',
      squawkFact: 'Squawk 7700 é o código de emergência universal do transponder de aviação.',
    },
  },

  ar: {
    nav: {
      home: 'الرئيسية', news: 'الأخبار', shorts: 'مقاطع قصيرة', flightLookup: 'البحث عن رحلة',
      forum: 'المنتدى', newsletter: 'النشرة الإخبارية', ranks: 'الرتب', pro: 'برو',
      lounge: 'الصالة', language: 'اللغة', readIn: 'اقرأ بـ',
    },
    common: {
      readMore: 'اقرأ المزيد', viewAll: 'عرض الكل', loading: 'جارٍ التحميل…',
      noResults: 'لم يتم العثور على نتائج', search: 'بحث', searchPlaceholder: 'ابحث في أخبار الطيران…',
      latestNews: 'آخر الأخبار', topStories: 'أبرز القصص', hotStories: 'الأكثر تداولاً',
      publishedAgo: 'منذ', views: 'مشاهدة', minutes: 'دقيقة', minRead: 'دقيقة للقراءة',
      backToNews: 'العودة إلى الأخبار', readInEnglish: 'اقرأ بالإنجليزية',
      autoTranslated: 'مترجم تلقائياً', shareArticle: 'مشاركة المقال',
      listenArticle: 'استمع إلى المقال', generatingAudio: 'جارٍ إنشاء الصوت مع جورج…',
    },
    home: {
      heroTitle: 'فلايت دراما', heroSubtitle: 'أخبار الطيران',
      latestStories: 'أحدث القصص', breakingNews: 'عاجل',
      followUs: 'تابعنا',
      newsletter: { title: 'نشرة فلايت دراما الإخبارية', subtitle: 'أخبار الطيران العاجلة والتحليلات الأسبوعية وأبرز أحداث المجتمع — مباشرة إلى صندوق بريدك.', placeholder: 'عنوان بريدك الإلكتروني', button: 'اشترك' },
    },
    news: {
      title: 'أخبار الطيران', subtitle: 'آخر أخبار الطيران والحوادث والقصص',
      allCategories: 'الكل', sortRecent: 'الأحدث', sortPopular: 'الأكثر مشاهدة',
      noArticles: 'لم يتم العثور على مقالات', noArticlesDesc: 'جرب فئة أو مصطلح بحث مختلفاً',
      clearFilters: 'مسح الفلاتر', trySearching: 'جرب البحث عن',
    },
    article: {
      by: 'بقلم', tags: 'الوسوم', relatedArticles: 'مقالات ذات صلة',
      youMightLike: 'قد يعجبك أيضاً', onThisDay: 'في مثل هذا اليوم',
      share: 'مشاركة', comments: 'التعليقات', leaveComment: 'اترك تعليقاً',
    },
    onThisDay: {
      title: 'في مثل هذا اليوم في تاريخ الطيران', subtitle: '365 يوماً من تاريخ الطيران',
      selectDay: 'اختر يوماً في التقويم لمعرفة ما حدث في تاريخ الطيران.',
      noEvents: 'لا توجد أحداث طيران مسجلة لهذا اليوم.',
      jumpToMonth: 'الانتقال إلى الشهر', today: 'اليوم', allEvents: 'جميع الأحداث',
      categories: { first: 'الأول', milestone: 'معلم', incident: 'حادثة', record: 'رقم قياسي' },
    },
    tags: {
      title: 'جميع وسوم الطيران', subtitle: 'تصفح المقالات حسب الموضوع',
      filterPlaceholder: 'تصفية الوسوم…', sortAZ: 'أ–ي', sortPopular: 'أكثر المقالات', sortRecent: 'الأحدث',
      articles: 'مقالات', noTags: 'لم يتم العثور على وسوم',
    },
    notFound: {
      title: '404', headline: 'هذه الصفحة غادرت البوابة',
      description: 'الصفحة التي تبحث عنها تم نقلها أو حذفها أو لم تكن موجودة أصلاً.',
      returnHome: 'العودة إلى الصالة', browseStories: 'تصفح المقالات',
      didYouKnow: 'هل تعلم؟',
      squawkFact: 'سكواك 7700 هو رمز الطوارئ العالمي لجهاز الترانسبوندر في الطيران.',
    },
  },
};

export function getStrings(locale: string): UIStrings {
  return STRINGS[locale] ?? STRINGS['en'];
}
