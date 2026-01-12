
import { Language } from "./types";

// Static flavor texts to replace AI generation
const FLAVOR_TEXTS = {
  win: {
    es: [
      "Buen trabajo. El barrio sabe quién manda.",
      "El respeto se gana con plomo. Hoy ganaste mucho.",
      "Ese soplón pagó caro su traición. Victoria.",
      "Tu nombre resuena en las calles. Sigue así.",
      "Limpieza total. No quedó ni uno para contarlo.",
      "La plaza es nuestra. Que corra la voz.",
      "Dinero fácil, trabajo sucio. Así nos gusta.",
      "Se metieron con el cartel equivocado.",
      "Hoy cenamos en el infierno, pero tú invitas.",
      "Nadie toca a la familia y vive para contarlo."
    ],
    en: [
      "Good job. The hood knows who's boss.",
      "Respect is earned with lead. You earned a lot today.",
      "That snitch paid dearly. Victory.",
      "Your name rings out in the streets. Keep it up.",
      "Clean sweep. No one left to tell the tale.",
      "The turf is ours. Spread the word.",
      "Easy money, dirty work. Just how we like it.",
      "They messed with the wrong cartel.",
      "We dine in hell tonight, but you're buying.",
      "No one touches the family and lives to tell about it."
    ],
    ru: [
      "Хорошая работа. Район знает, кто здесь босс.",
      "Уважение зарабатывается свинцом. Сегодня ты заработал много.",
      "Этот стукач дорого заплатил. Победа.",
      "Твое имя гремит на улицах. Так держать.",
      "Полная зачистка. Никого не осталось.",
      "Территория наша. Распространите слово.",
      "Легкие деньги, грязная работа. Как нам нравится.",
      "Они связались не с тем картелем.",
      "Сегодня мы ужинаем в аду, но платишь ты.",
      "Никто не трогает семью и остается в живых."
    ],
    ar: [
      "عمل جيد. الحي يعرف من هو الرئيس.",
      "الاحترام يُكتسب بالرصاص. لقد كسبت الكثير اليوم.",
      "ذلك الواشي دفع الثمن غالياً. نصر.",
      "اسمك يتردد في الشوارع. استمر هكذا.",
      "مسح شامل. لم يبق أحد ليروي الحكاية.",
      "المنطقة لنا. انشر الكلمة.",
      "مال سهل، عمل قذر. تماماً كما نحب.",
      "لقد عبثوا مع الكارتل الخطأ.",
      "سنتعشى في الجحيم الليلة، لكنك ستدفع.",
      "لا أحد يمس العائلة ويعيش ليروي القصة."
    ]
  },
  lose: {
    es: [
      "Esta vez te pillaron. No vuelvas a fallar.",
      "Te dieron una paliza. Levántate y véngate.",
      "Mala suerte, patrón. Perdimos el cargamento.",
      "Nos emboscaron. Tuvimos que retirarnos.",
      "El hospital está lleno de los nuestros. Día negro.",
      "Nos vendieron. Alguien va a pagar por esto.",
      "Retirada táctica. Volveremos más fuertes.",
      "Hoy perdimos sangre, mañana la recuperaremos.",
      "La policía llegó antes de tiempo. Todo mal.",
      "Un error de cálculo. No se repetirá."
    ],
    en: [
      "They caught you this time. Don't fail again.",
      "You took a beating. Get up and get revenge.",
      "Bad luck, boss. We lost the shipment.",
      "We were ambushed. Had to retreat.",
      "The hospital is full of our guys. Dark day.",
      "We were sold out. Someone is going to pay for this.",
      "Tactical retreat. We'll be back stronger.",
      "Today we lost blood, tomorrow we take it back.",
      "The cops arrived early. Everything went wrong.",
      "A miscalculation. It won't happen again."
    ],
    ru: [
      "В этот раз тебя поймали. Не ошибись снова.",
      "Тебя избили. Вставай и мсти.",
      "Невезение, босс. Мы потеряли груз.",
      "Нас устроили засаду. Пришлось отступить.",
      "Больница полна наших парней. Черный день.",
      "Нас продали. Кто-то заплатит за это.",
      "Тактическое отступление. Мы вернемся сильнее.",
      "Сегодня мы потеряли кровь, завтра мы ее вернем.",
      "Копы приехали рано. Все пошло не так.",
      "Просчет. Это не повторится."
    ],
    ar: [
      "لقد أمسكوا بك هذه المرة. لا تفشل مرة أخرى.",
      "لقد تعرضت للضرب. انهض وانتقم.",
      "حظ سيء يا زعيم. فقدنا الشحنة.",
      "لقد وقعنا في كمين. اضطررنا للتراجع.",
      "المستشفى مليء برجالنا. يوم أسود.",
      "لقد تم بيعنا. شخص ما سيدفع الثمن.",
      "تراجع تكتيكي. سنعود أقوى.",
      "اليوم فقدنا الدماء، وغداً سنستعيدها.",
      "وصلت الشرطة مبكراً. كل شيء ساء.",
      "سوء تقدير. لن يتكرر."
    ]
  },
  claim: {
    es: [
      "Dinero limpio, conciencia sucia.",
      "A la saca. Mañana habrá más.",
      "El negocio va viento en popa.",
      "Plata para el bolsillo, plomo para el resto.",
      "Lavado y planchado. Listo para gastar.",
      "Los contadores están felices hoy.",
      "Un buen día para ser el jefe.",
      "Esto paga las balas y el whisky."
    ],
    en: [
      "Clean money, dirty conscience.",
      "In the bag. Tomorrow there will be more.",
      "Business is booming.",
      "Silver for the pocket, lead for the rest.",
      "Laundered and pressed. Ready to spend.",
      "The accountants are happy today.",
      "A good day to be the boss.",
      "This pays for the bullets and the whiskey."
    ],
    ru: [
      "Чистые деньги, грязная совесть.",
      "В мешок. Завтра будет больше.",
      "Бизнес идет в гору.",
      "Серебро в карман, свинец остальным.",
      "Отмыто и выглажено. Готово к тратам.",
      "Бухгалтеры сегодня счастливы.",
      "Хороший день, чтобы быть боссом.",
      "Это платит за пули и виски."
    ],
    ar: [
      "مال نظيف، ضمير قذر.",
      "في الحقيبة. غداً سيكون هناك المزيد.",
      "العمل يزدهر.",
      "فضة للجيب، ورصاص للباقي.",
      "مغسول ومكوي. جاهز للإنفاق.",
      "المحاسبون سعداء اليوم.",
      "يوم جيد لتكون الزعيم.",
      "هذا يدفع ثمن الرصاص والويسكي."
    ]
  },
  intro: {
    es: [
      "Bienvenido a la familia.",
      "Prepara tu arma, hoy será un día largo.",
      "Las calles están tranquilas... demasiado tranquilas.",
      "Tu reputación te precede, forastero.",
      "Ojos abiertos, boca cerrada. Regla número uno."
    ],
    en: [
      "Welcome to the family.",
      "Ready your weapon, today will be a long day.",
      "The streets are quiet... too quiet.",
      "Your reputation precedes you, stranger.",
      "Eyes open, mouth shut. Rule number one."
    ],
    ru: [
      "Добро пожаловать в семью.",
      "Готовь оружие, сегодня будет долгий день.",
      "На улицах тихо... слишком тихо.",
      "Твоя репутация опережает тебя, незнакомец.",
      "Глаза открыты, рот закрыт. Правило номер один."
    ],
    ar: [
      "أهلاً بك في العائلة.",
      "جهز سلاحك، اليوم سيكون طويلاً.",
      "الشوارع هادئة... هادئة جداً.",
      "سمعتك تسبقك يا غريب.",
      "عيون مفتوحة، فم مغلق. القاعدة رقم واحد."
    ]
  }
};

export const getMafiaFlavor = async (type: 'win' | 'lose' | 'claim' | 'intro', lang: Language = 'es', context: string = '') => {
  // Simulate async delay for realism/compatibility
  await new Promise(resolve => setTimeout(resolve, 100));

  const category = FLAVOR_TEXTS[type];
  if (!category) return "...";

  // Default to English if specific language not found
  const texts = category[lang] || category['en'];

  if (!texts || texts.length === 0) return "...";

  // Return random text
  return texts[Math.floor(Math.random() * texts.length)];
};
