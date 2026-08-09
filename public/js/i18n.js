// نظام ترجمة واجهة التطبيق الثابتة (أزرار، تسميات، عناوين) - ترجمة آلية تقريبية
// اللغة المختارة تُحفظ في localStorage وتُطبّق عبر عناصر data-i18n / data-i18n-placeholder
(function () {
  const RTL_LANGS = ['ar', 'fa', 'ur', 'he'];

  const LANGUAGES = [
    { code: 'ar', name: 'العربية' },
    { code: 'en', name: 'English' },
    { code: 'fr', name: 'Français' },
    { code: 'es', name: 'Español' },
    { code: 'de', name: 'Deutsch' },
    { code: 'it', name: 'Italiano' },
    { code: 'pt', name: 'Português' },
    { code: 'ru', name: 'Русский' },
    { code: 'tr', name: 'Türkçe' },
    { code: 'fa', name: 'فارسی' },
    { code: 'ur', name: 'اردو' },
    { code: 'hi', name: 'हिन्दी' },
    { code: 'bn', name: 'বাংলা' },
    { code: 'id', name: 'Bahasa Indonesia' },
    { code: 'ms', name: 'Bahasa Melayu' },
    { code: 'tl', name: 'Filipino' },
    { code: 'th', name: 'ไทย' },
    { code: 'vi', name: 'Tiếng Việt' },
    { code: 'zh', name: '中文' },
    { code: 'ja', name: '日本語' },
    { code: 'ko', name: '한국어' },
    { code: 'nl', name: 'Nederlands' },
    { code: 'sv', name: 'Svenska' },
    { code: 'pl', name: 'Polski' },
    { code: 'uk', name: 'Українська' },
    { code: 'ro', name: 'Română' },
    { code: 'cs', name: 'Čeština' },
    { code: 'el', name: 'Ελληνικά' },
    { code: 'he', name: 'עברית' },
    { code: 'sw', name: 'Kiswahili' },
    { code: 'am', name: 'አማርኛ' },
    { code: 'ha', name: 'Hausa' },
    { code: 'pa', name: 'ਪੰਜਾਬੀ' },
    { code: 'ta', name: 'தமிழ்' },
    { code: 'so', name: 'Soomaali' },
  ];

  const KEYS = [
    'app_tagline', 'tab_login', 'tab_register', 'role_customer', 'role_kitchen',
    'label_name', 'label_email', 'label_phone', 'label_password',
    'btn_login', 'btn_create_account',
    'verify_hint_before', 'verify_hint_after', 'label_code', 'btn_verify', 'btn_resend', 'btn_back',
    'cart_view', 'cart_title', 'label_table', 'label_notes', 'label_total', 'btn_submit_order', 'btn_close',
    'my_orders_title', 'kitchen_title', 'col_new', 'col_preparing', 'col_ready',
    'settings_title', 'settings_sound_title', 'settings_dark_title', 'settings_lang_title',
  ];

  // كل صف = لغة، بنفس ترتيب KEYS أعلاه
  const ROWS = {
    ar: ['نكهة بيتنا... وصلتك أينما كنت', 'تسجيل الدخول', 'إنشاء حساب جديد', 'عميل', 'طاقم المطبخ', 'الاسم', 'البريد الإلكتروني', 'رقم الجوال', 'كلمة المرور', 'دخول', 'إنشاء الحساب', 'أرسلنا رمز تحقق مكوّن من 6 أرقام إلى جوالك', '، أدخله هنا لتفعيل حسابك.', 'رمز التحقق', 'تحقق وتفعيل الحساب', 'لم يصلني الرمز؟ إعادة الإرسال', 'رجوع', 'عرض السلة', 'سلتك', 'رقم الطاولة', 'ملاحظات (اختياري)', 'الإجمالي', 'إرسال الطلب للمطبخ', 'إغلاق', 'طلباتي', 'لوحة المطبخ', 'طلبات جديدة', 'قيد التحضير', 'جاهزة للتسليم', 'الإعدادات', 'صوت التنبيه', 'الوضع الداكن', 'اللغة'],
    en: ['Flavors of home, delivered wherever you are', 'Log In', 'Create Account', 'Customer', 'Kitchen Staff', 'Name', 'Email', 'Phone Number', 'Password', 'Log In', 'Create Account', 'We sent a 6-digit verification code to your phone', '. Enter it below to activate your account.', 'Verification Code', 'Verify & Activate', "Didn't receive it? Resend", 'Back', 'View Cart', 'Your Cart', 'Table Number', 'Notes (optional)', 'Total', 'Send Order to Kitchen', 'Close', 'My Orders', 'Kitchen Dashboard', 'New Orders', 'Preparing', 'Ready for Pickup', 'Settings', 'Notification Sound', 'Dark Mode', 'Language'],
    fr: ["Les saveurs de la maison, livrées où que vous soyez", 'Connexion', 'Créer un compte', 'Client', 'Personnel de cuisine', 'Nom', 'E-mail', 'Numéro de téléphone', 'Mot de passe', 'Connexion', 'Créer le compte', 'Nous avons envoyé un code à 6 chiffres à votre téléphone', ". Entrez-le ci-dessous pour activer votre compte.", 'Code de vérification', 'Vérifier et activer', "Pas reçu ? Renvoyer", 'Retour', 'Voir le panier', 'Votre panier', 'Numéro de table', 'Remarques (optionnel)', 'Total', 'Envoyer la commande', 'Fermer', 'Mes commandes', 'Tableau de bord cuisine', 'Nouvelles commandes', 'En préparation', 'Prêt à servir', 'Paramètres', 'Son de notification', 'Mode sombre', 'Langue'],
    es: ['Sabores de casa, donde quiera que estés', 'Iniciar sesión', 'Crear cuenta', 'Cliente', 'Personal de cocina', 'Nombre', 'Correo electrónico', 'Número de teléfono', 'Contraseña', 'Iniciar sesión', 'Crear cuenta', 'Enviamos un código de 6 dígitos a tu teléfono', '. Ingrésalo abajo para activar tu cuenta.', 'Código de verificación', 'Verificar y activar', '¿No lo recibiste? Reenviar', 'Atrás', 'Ver carrito', 'Tu carrito', 'Número de mesa', 'Notas (opcional)', 'Total', 'Enviar pedido a cocina', 'Cerrar', 'Mis pedidos', 'Panel de cocina', 'Pedidos nuevos', 'En preparación', 'Listo para recoger', 'Configuración', 'Sonido de notificación', 'Modo oscuro', 'Idioma'],
    de: ['Geschmack von zu Hause, geliefert wo immer du bist', 'Anmelden', 'Konto erstellen', 'Kunde', 'Küchenpersonal', 'Name', 'E-Mail', 'Telefonnummer', 'Passwort', 'Anmelden', 'Konto erstellen', 'Wir haben einen 6-stelligen Code an dein Telefon gesendet', '. Gib ihn unten ein, um dein Konto zu aktivieren.', 'Bestätigungscode', 'Bestätigen & Aktivieren', 'Nicht erhalten? Erneut senden', 'Zurück', 'Warenkorb ansehen', 'Dein Warenkorb', 'Tischnummer', 'Notizen (optional)', 'Gesamt', 'Bestellung an Küche senden', 'Schließen', 'Meine Bestellungen', 'Küchen-Dashboard', 'Neue Bestellungen', 'In Zubereitung', 'Abholbereit', 'Einstellungen', 'Benachrichtigungston', 'Dunkler Modus', 'Sprache'],
    it: ['Sapori di casa, ovunque tu sia', 'Accedi', 'Crea account', 'Cliente', 'Personale di cucina', 'Nome', 'E-mail', 'Numero di telefono', 'Password', 'Accedi', 'Crea account', 'Abbiamo inviato un codice a 6 cifre al tuo telefono', '. Inseriscilo qui sotto per attivare il tuo account.', 'Codice di verifica', 'Verifica e attiva', 'Non ricevuto? Invia di nuovo', 'Indietro', 'Vedi carrello', 'Il tuo carrello', 'Numero tavolo', 'Note (opzionale)', 'Totale', 'Invia ordine alla cucina', 'Chiudi', 'I miei ordini', 'Pannello cucina', 'Nuovi ordini', 'In preparazione', 'Pronto per il ritiro', 'Impostazioni', 'Suono di notifica', 'Modalità scura', 'Lingua'],
    pt: ['Sabores de casa, entregues onde você estiver', 'Entrar', 'Criar conta', 'Cliente', 'Equipe da cozinha', 'Nome', 'E-mail', 'Número de telefone', 'Senha', 'Entrar', 'Criar conta', 'Enviamos um código de 6 dígitos para o seu telefone', '. Digite-o abaixo para ativar sua conta.', 'Código de verificação', 'Verificar e ativar', 'Não recebeu? Reenviar', 'Voltar', 'Ver carrinho', 'Seu carrinho', 'Número da mesa', 'Notas (opcional)', 'Total', 'Enviar pedido à cozinha', 'Fechar', 'Meus pedidos', 'Painel da cozinha', 'Novos pedidos', 'Em preparo', 'Pronto para retirada', 'Configurações', 'Som de notificação', 'Modo escuro', 'Idioma'],
    ru: ['Домашний вкус, доставленный куда угодно', 'Войти', 'Создать аккаунт', 'Клиент', 'Персонал кухни', 'Имя', 'Эл. почта', 'Номер телефона', 'Пароль', 'Войти', 'Создать аккаунт', 'Мы отправили 6-значный код на ваш телефон', '. Введите его ниже, чтобы активировать аккаунт.', 'Код подтверждения', 'Подтвердить и активировать', 'Не получили? Отправить снова', 'Назад', 'Показать корзину', 'Ваша корзина', 'Номер столика', 'Примечания (необязательно)', 'Итого', 'Отправить заказ на кухню', 'Закрыть', 'Мои заказы', 'Панель кухни', 'Новые заказы', 'Готовится', 'Готово к выдаче', 'Настройки', 'Звук уведомления', 'Тёмная тема', 'Язык'],
    tr: ['Evin lezzeti, her yerde yanınızda', 'Giriş Yap', 'Hesap Oluştur', 'Müşteri', 'Mutfak Personeli', 'Ad', 'E-posta', 'Telefon Numarası', 'Şifre', 'Giriş Yap', 'Hesap Oluştur', 'Telefonunuza 6 haneli bir kod gönderdik', '. Hesabınızı etkinleştirmek için aşağıya girin.', 'Doğrulama Kodu', 'Doğrula ve Etkinleştir', 'Almadınız mı? Tekrar gönder', 'Geri', 'Sepeti Görüntüle', 'Sepetiniz', 'Masa Numarası', 'Notlar (isteğe bağlı)', 'Toplam', 'Siparişi Mutfağa Gönder', 'Kapat', 'Siparişlerim', 'Mutfak Paneli', 'Yeni Siparişler', 'Hazırlanıyor', 'Teslime Hazır', 'Ayarlar', 'Bildirim Sesi', 'Karanlık Mod', 'Dil'],
    fa: ['طعم خانه، هرجا که باشید', 'ورود', 'ایجاد حساب', 'مشتری', 'کارکنان آشپزخانه', 'نام', 'ایمیل', 'شماره موبایل', 'رمز عبور', 'ورود', 'ایجاد حساب', 'کد ۶ رقمی به موبایل شما ارسال شد', '. برای فعال‌سازی حساب آن را وارد کنید.', 'کد تأیید', 'تأیید و فعال‌سازی', 'کد نرسید؟ ارسال مجدد', 'بازگشت', 'مشاهده سبد', 'سبد شما', 'شماره میز', 'یادداشت (اختیاری)', 'مجموع', 'ارسال سفارش به آشپزخانه', 'بستن', 'سفارش‌های من', 'پنل آشپزخانه', 'سفارش‌های جدید', 'در حال آماده‌سازی', 'آماده تحویل', 'تنظیمات', 'صدای اعلان', 'حالت تیره', 'زبان'],
    ur: ['گھر کا ذائقہ، جہاں بھی آپ ہوں', 'لاگ اِن', 'اکاؤنٹ بنائیں', 'گاہک', 'کچن اسٹاف', 'نام', 'ای میل', 'موبائل نمبر', 'پاس ورڈ', 'لاگ اِن', 'اکاؤنٹ بنائیں', 'ہم نے آپ کے موبائل پر 6 ہندسوں کا کوڈ بھیجا ہے', '۔ اکاؤنٹ فعال کرنے کے لیے نیچے درج کریں۔', 'تصدیقی کوڈ', 'تصدیق اور فعال کریں', 'کوڈ نہیں ملا؟ دوبارہ بھیجیں', 'واپس', 'کارٹ دیکھیں', 'آپ کا کارٹ', 'میز نمبر', 'نوٹس (اختیاری)', 'کل', 'آرڈر کچن کو بھیجیں', 'بند کریں', 'میرے آرڈرز', 'کچن ڈیش بورڈ', 'نئے آرڈرز', 'تیار ہو رہا ہے', 'وصولی کے لیے تیار', 'ترتیبات', 'اطلاعی آواز', 'ڈارک موڈ', 'زبان'],
    hi: ['घर का स्वाद, जहाँ भी आप हों', 'लॉग इन करें', 'खाता बनाएं', 'ग्राहक', 'रसोई स्टाफ', 'नाम', 'ईमेल', 'फ़ोन नंबर', 'पासवर्ड', 'लॉग इन करें', 'खाता बनाएं', 'हमने आपके फ़ोन पर 6 अंकों का कोड भेजा है', '। खाता सक्रिय करने के लिए इसे नीचे दर्ज करें।', 'सत्यापन कोड', 'सत्यापित करें और सक्रिय करें', 'कोड नहीं मिला? फिर भेजें', 'वापस', 'कार्ट देखें', 'आपका कार्ट', 'टेबल नंबर', 'नोट्स (वैकल्पिक)', 'कुल', 'ऑर्डर रसोई में भेजें', 'बंद करें', 'मेरे ऑर्डर', 'रसोई डैशबोर्ड', 'नए ऑर्डर', 'तैयार हो रहा है', 'लेने के लिए तैयार', 'सेटिंग्स', 'सूचना ध्वनि', 'डार्क मोड', 'भाषा'],
    bn: ['ঘরের স্বাদ, যেখানেই থাকুন', 'লগ ইন', 'অ্যাকাউন্ট তৈরি করুন', 'গ্রাহক', 'রান্নাঘর কর্মী', 'নাম', 'ইমেইল', 'ফোন নম্বর', 'পাসওয়ার্ড', 'লগ ইন', 'অ্যাকাউন্ট তৈরি করুন', 'আমরা আপনার ফোনে ৬-সংখ্যার কোড পাঠিয়েছি', '। অ্যাকাউন্ট সক্রিয় করতে নিচে লিখুন।', 'যাচাই কোড', 'যাচাই ও সক্রিয় করুন', 'পাননি? আবার পাঠান', 'ফিরে যান', 'কার্ট দেখুন', 'আপনার কার্ট', 'টেবিল নম্বর', 'নোট (ঐচ্ছিক)', 'মোট', 'অর্ডার রান্নাঘরে পাঠান', 'বন্ধ করুন', 'আমার অর্ডার', 'কিচেন ড্যাশবোর্ড', 'নতুন অর্ডার', 'প্রস্তুত হচ্ছে', 'নেওয়ার জন্য প্রস্তুত', 'সেটিংস', 'বিজ্ঞপ্তি শব্দ', 'ডার্ক মোড', 'ভাষা'],
    id: ['Cita rasa rumah, diantar ke mana saja', 'Masuk', 'Buat Akun', 'Pelanggan', 'Staf Dapur', 'Nama', 'Email', 'Nomor Telepon', 'Kata Sandi', 'Masuk', 'Buat Akun', 'Kami mengirim kode 6 digit ke ponsel Anda', '. Masukkan di bawah untuk mengaktifkan akun.', 'Kode Verifikasi', 'Verifikasi & Aktifkan', 'Belum menerima? Kirim ulang', 'Kembali', 'Lihat Keranjang', 'Keranjang Anda', 'Nomor Meja', 'Catatan (opsional)', 'Total', 'Kirim Pesanan ke Dapur', 'Tutup', 'Pesanan Saya', 'Dasbor Dapur', 'Pesanan Baru', 'Sedang Disiapkan', 'Siap Diambil', 'Pengaturan', 'Suara Notifikasi', 'Mode Gelap', 'Bahasa'],
    ms: ['Rasa rumah, dihantar ke mana sahaja', 'Log Masuk', 'Cipta Akaun', 'Pelanggan', 'Kakitangan Dapur', 'Nama', 'E-mel', 'Nombor Telefon', 'Kata Laluan', 'Log Masuk', 'Cipta Akaun', 'Kami menghantar kod 6 digit ke telefon anda', '. Masukkan di bawah untuk mengaktifkan akaun.', 'Kod Pengesahan', 'Sahkan & Aktifkan', 'Tidak diterima? Hantar semula', 'Kembali', 'Lihat Troli', 'Troli Anda', 'Nombor Meja', 'Nota (pilihan)', 'Jumlah', 'Hantar Pesanan ke Dapur', 'Tutup', 'Pesanan Saya', 'Papan Pemuka Dapur', 'Pesanan Baharu', 'Sedang Disediakan', 'Sedia Diambil', 'Tetapan', 'Bunyi Pemberitahuan', 'Mod Gelap', 'Bahasa'],
    tl: ['Lasa ng tahanan, kahit saan ka man', 'Mag-log In', 'Gumawa ng Account', 'Customer', 'Kitchen Staff', 'Pangalan', 'Email', 'Numero ng Telepono', 'Password', 'Mag-log In', 'Gumawa ng Account', 'Nagpadala kami ng 6-digit na code sa iyong telepono', '. Ilagay ito sa ibaba para i-activate ang account mo.', 'Verification Code', 'I-verify at I-activate', 'Hindi natanggap? Ipadala ulit', 'Bumalik', 'Tingnan ang Cart', 'Iyong Cart', 'Numero ng Mesa', 'Mga Tala (opsyonal)', 'Kabuuan', 'Ipadala ang Order sa Kusina', 'Isara', 'Aking mga Order', 'Kitchen Dashboard', 'Mga Bagong Order', 'Inihahanda', 'Handa nang Kunin', 'Mga Setting', 'Tunog ng Abiso', 'Madilim na Mode', 'Wika'],
    th: ['รสชาติบ้าน ส่งถึงคุณทุกที่', 'เข้าสู่ระบบ', 'สร้างบัญชี', 'ลูกค้า', 'พนักงานครัว', 'ชื่อ', 'อีเมล', 'หมายเลขโทรศัพท์', 'รหัสผ่าน', 'เข้าสู่ระบบ', 'สร้างบัญชี', 'เราส่งรหัส 6 หลักไปยังโทรศัพท์ของคุณ', ' กรอกด้านล่างเพื่อเปิดใช้งานบัญชี', 'รหัสยืนยัน', 'ยืนยันและเปิดใช้งาน', 'ไม่ได้รับรหัส? ส่งอีกครั้ง', 'ย้อนกลับ', 'ดูตะกร้า', 'ตะกร้าของคุณ', 'หมายเลขโต๊ะ', 'หมายเหตุ (ไม่บังคับ)', 'ยอดรวม', 'ส่งคำสั่งซื้อไปครัว', 'ปิด', 'คำสั่งซื้อของฉัน', 'แดชบอร์ดครัว', 'คำสั่งซื้อใหม่', 'กำลังเตรียม', 'พร้อมรับ', 'การตั้งค่า', 'เสียงแจ้งเตือน', 'โหมดมืด', 'ภาษา'],
    vi: ['Hương vị nhà, giao đến mọi nơi', 'Đăng nhập', 'Tạo tài khoản', 'Khách hàng', 'Nhân viên bếp', 'Tên', 'Email', 'Số điện thoại', 'Mật khẩu', 'Đăng nhập', 'Tạo tài khoản', 'Chúng tôi đã gửi mã 6 chữ số đến điện thoại của bạn', '. Nhập bên dưới để kích hoạt tài khoản.', 'Mã xác minh', 'Xác minh & Kích hoạt', 'Chưa nhận được? Gửi lại', 'Quay lại', 'Xem giỏ hàng', 'Giỏ hàng của bạn', 'Số bàn', 'Ghi chú (tùy chọn)', 'Tổng cộng', 'Gửi đơn đến bếp', 'Đóng', 'Đơn hàng của tôi', 'Bảng điều khiển bếp', 'Đơn mới', 'Đang chuẩn bị', 'Sẵn sàng nhận', 'Cài đặt', 'Âm thanh thông báo', 'Chế độ tối', 'Ngôn ngữ'],
    zh: ['家的味道，送到您所在之处', '登录', '创建账户', '顾客', '厨房员工', '姓名', '电子邮件', '电话号码', '密码', '登录', '创建账户', '我们已向您的手机发送了6位验证码', '。请在下方输入以激活账户。', '验证码', '验证并激活', '没收到？重新发送', '返回', '查看购物车', '您的购物车', '桌号', '备注（可选）', '总计', '发送订单到厨房', '关闭', '我的订单', '厨房面板', '新订单', '准备中', '可取餐', '设置', '通知音', '深色模式', '语言'],
    ja: ['家庭の味を、どこへでもお届け', 'ログイン', 'アカウント作成', 'お客様', 'キッチンスタッフ', '名前', 'メール', '電話番号', 'パスワード', 'ログイン', 'アカウント作成', '6桁の認証コードを電話に送信しました', '。以下に入力してアカウントを有効化してください。', '認証コード', '確認して有効化', '届きませんか？再送信', '戻る', 'カートを見る', 'あなたのカート', 'テーブル番号', 'メモ（任意）', '合計', '注文をキッチンに送信', '閉じる', '注文履歴', 'キッチンダッシュボード', '新規注文', '準備中', '受け取り準備完了', '設定', '通知音', 'ダークモード', '言語'],
    ko: ['집의 맛을 어디서나', '로그인', '계정 만들기', '고객', '주방 직원', '이름', '이메일', '전화번호', '비밀번호', '로그인', '계정 만들기', '휴대폰으로 6자리 코드를 보냈습니다', '. 아래에 입력하여 계정을 활성화하세요.', '인증 코드', '확인 및 활성화', '못 받으셨나요? 재전송', '뒤로', '장바구니 보기', '내 장바구니', '테이블 번호', '메모 (선택)', '합계', '주방으로 주문 보내기', '닫기', '내 주문', '주방 대시보드', '신규 주문', '준비 중', '픽업 준비 완료', '설정', '알림음', '다크 모드', '언어'],
    nl: ['Smaak van thuis, geleverd waar je ook bent', 'Inloggen', 'Account aanmaken', 'Klant', 'Keukenpersoneel', 'Naam', 'E-mail', 'Telefoonnummer', 'Wachtwoord', 'Inloggen', 'Account aanmaken', 'We hebben een 6-cijferige code naar je telefoon gestuurd', '. Voer deze hieronder in om je account te activeren.', 'Verificatiecode', 'Verifiëren & activeren', 'Niet ontvangen? Opnieuw verzenden', 'Terug', 'Winkelwagen bekijken', 'Je winkelwagen', 'Tafelnummer', 'Opmerkingen (optioneel)', 'Totaal', 'Bestelling naar keuken sturen', 'Sluiten', 'Mijn bestellingen', 'Keuken dashboard', 'Nieuwe bestellingen', 'In bereiding', 'Klaar om af te halen', 'Instellingen', 'Meldingsgeluid', 'Donkere modus', 'Taal'],
    sv: ['Hemlagad smak, levererad var du än är', 'Logga in', 'Skapa konto', 'Kund', 'Kökspersonal', 'Namn', 'E-post', 'Telefonnummer', 'Lösenord', 'Logga in', 'Skapa konto', 'Vi skickade en 6-siffrig kod till din telefon', '. Ange den nedan för att aktivera ditt konto.', 'Verifieringskod', 'Verifiera & aktivera', 'Fick du ingen? Skicka igen', 'Tillbaka', 'Visa varukorg', 'Din varukorg', 'Bordsnummer', 'Anteckningar (valfritt)', 'Totalt', 'Skicka beställning till köket', 'Stäng', 'Mina beställningar', 'Köks-dashboard', 'Nya beställningar', 'Förbereds', 'Redo för avhämtning', 'Inställningar', 'Aviseringsljud', 'Mörkt läge', 'Språk'],
    pl: ['Smak domu, dostarczony wszędzie', 'Zaloguj się', 'Utwórz konto', 'Klient', 'Personel kuchni', 'Imię', 'E-mail', 'Numer telefonu', 'Hasło', 'Zaloguj się', 'Utwórz konto', 'Wysłaliśmy 6-cyfrowy kod na Twój telefon', '. Wpisz go poniżej, aby aktywować konto.', 'Kod weryfikacyjny', 'Zweryfikuj i aktywuj', 'Nie otrzymano? Wyślij ponownie', 'Wstecz', 'Zobacz koszyk', 'Twój koszyk', 'Numer stolika', 'Uwagi (opcjonalnie)', 'Suma', 'Wyślij zamówienie do kuchni', 'Zamknij', 'Moje zamówienia', 'Panel kuchni', 'Nowe zamówienia', 'W przygotowaniu', 'Gotowe do odbioru', 'Ustawienia', 'Dźwięk powiadomień', 'Tryb ciemny', 'Język'],
    uk: ['Смак дому, доставлений будь-де', 'Увійти', 'Створити акаунт', 'Клієнт', 'Персонал кухні', "Ім'я", 'Ел. пошта', 'Номер телефону', 'Пароль', 'Увійти', 'Створити акаунт', 'Ми надіслали 6-значний код на ваш телефон', '. Введіть його нижче, щоб активувати акаунт.', 'Код підтвердження', 'Підтвердити й активувати', 'Не отримали? Надіслати ще раз', 'Назад', 'Переглянути кошик', 'Ваш кошик', 'Номер столика', 'Примітки (необов’язково)', 'Разом', 'Надіслати замовлення на кухню', 'Закрити', 'Мої замовлення', 'Панель кухні', 'Нові замовлення', 'Готується', 'Готово до видачі', 'Налаштування', 'Звук сповіщення', 'Темна тема', 'Мова'],
    ro: ['Gustul de acasă, livrat oriunde ai fi', 'Conectare', 'Creează cont', 'Client', 'Personal bucătărie', 'Nume', 'E-mail', 'Număr de telefon', 'Parolă', 'Conectare', 'Creează cont', 'Am trimis un cod din 6 cifre pe telefonul tău', '. Introdu-l mai jos pentru a-ți activa contul.', 'Cod de verificare', 'Verifică și activează', 'Nu l-ai primit? Retrimite', 'Înapoi', 'Vezi coșul', 'Coșul tău', 'Număr masă', 'Note (opțional)', 'Total', 'Trimite comanda la bucătărie', 'Închide', 'Comenzile mele', 'Panou bucătărie', 'Comenzi noi', 'În pregătire', 'Gata de ridicare', 'Setări', 'Sunet notificare', 'Mod întunecat', 'Limbă'],
    cs: ['Chuť domova, doručená kamkoli', 'Přihlásit se', 'Vytvořit účet', 'Zákazník', 'Personál kuchyně', 'Jméno', 'E-mail', 'Telefonní číslo', 'Heslo', 'Přihlásit se', 'Vytvořit účet', 'Odeslali jsme 6místný kód na váš telefon', '. Zadejte jej níže pro aktivaci účtu.', 'Ověřovací kód', 'Ověřit a aktivovat', 'Nedostali jste ho? Odeslat znovu', 'Zpět', 'Zobrazit košík', 'Váš košík', 'Číslo stolu', 'Poznámky (volitelné)', 'Celkem', 'Odeslat objednávku do kuchyně', 'Zavřít', 'Moje objednávky', 'Přehled kuchyně', 'Nové objednávky', 'Připravuje se', 'Připraveno k vyzvednutí', 'Nastavení', 'Zvuk oznámení', 'Tmavý režim', 'Jazyk'],
    el: ['Γεύση σπιτιού, όπου κι αν βρίσκεστε', 'Σύνδεση', 'Δημιουργία λογαριασμού', 'Πελάτης', 'Προσωπικό κουζίνας', 'Όνομα', 'Email', 'Αριθμός τηλεφώνου', 'Κωδικός', 'Σύνδεση', 'Δημιουργία λογαριασμού', 'Στείλαμε έναν 6ψήφιο κωδικό στο τηλέφωνό σας', '. Εισαγάγετέ τον παρακάτω για ενεργοποίηση.', 'Κωδικός επαλήθευσης', 'Επαλήθευση & Ενεργοποίηση', 'Δεν τον λάβατε; Αποστολή ξανά', 'Πίσω', 'Προβολή καλαθιού', 'Το καλάθι σας', 'Αριθμός τραπεζιού', 'Σημειώσεις (προαιρετικό)', 'Σύνολο', 'Αποστολή παραγγελίας στην κουζίνα', 'Κλείσιμο', 'Οι παραγγελίες μου', 'Πίνακας κουζίνας', 'Νέες παραγγελίες', 'Σε προετοιμασία', 'Έτοιμο για παραλαβή', 'Ρυθμίσεις', 'Ήχος ειδοποίησης', 'Σκοτεινή λειτουργία', 'Γλώσσα'],
    he: ['טעם הבית, מגיע לכל מקום', 'התחברות', 'יצירת חשבון', 'לקוח', 'צוות המטבח', 'שם', 'אימייל', 'מספר טלפון', 'סיסמה', 'התחברות', 'יצירת חשבון', 'שלחנו קוד בן 6 ספרות לטלפון שלך', '. הזן אותו למטה כדי להפעיל את החשבון.', 'קוד אימות', 'אמת והפעל', 'לא קיבלת? שלח שוב', 'חזרה', 'הצג עגלה', 'העגלה שלך', 'מספר שולחן', 'הערות (רשות)', 'סה"כ', 'שלח הזמנה למטבח', 'סגור', 'ההזמנות שלי', 'לוח בקרה למטבח', 'הזמנות חדשות', 'בהכנה', 'מוכן לאיסוף', 'הגדרות', 'צליל התראה', 'מצב כהה', 'שפה'],
    sw: ['Ladha ya nyumbani, kufikishwa popote ulipo', 'Ingia', 'Fungua Akaunti', 'Mteja', 'Wafanyakazi wa Jikoni', 'Jina', 'Barua pepe', 'Nambari ya Simu', 'Nenosiri', 'Ingia', 'Fungua Akaunti', 'Tumetuma msimbo wa tarakimu 6 kwenye simu yako', '. Ingiza hapa chini kuwezesha akaunti yako.', 'Msimbo wa Uthibitisho', 'Thibitisha na Uwezeshe', 'Haujapokea? Tuma tena', 'Rudi', 'Angalia Kikapu', 'Kikapu Chako', 'Nambari ya Meza', 'Maelezo (hiari)', 'Jumla', 'Tuma Agizo Jikoni', 'Funga', 'Maagizo Yangu', 'Dashibodi ya Jikoni', 'Maagizo Mapya', 'Yanaandaliwa', 'Tayari Kuchukuliwa', 'Mipangilio', 'Sauti ya Arifa', 'Hali ya Giza', 'Lugha'],
    am: ['የቤት ጣዕም፣ የትም ቢሆኑ ይደርሳል', 'ግባ', 'መለያ ፍጠር', 'ደንበኛ', 'የወጥ ቤት ሰራተኞች', 'ስም', 'ኢሜይል', 'የስልክ ቁጥር', 'የይለፍ ቃል', 'ግባ', 'መለያ ፍጠር', 'የ6 አሃዝ ኮድ ወደ ስልክዎ ልከናል', '። መለያዎን ለማንቃት ከታች ያስገቡት።', 'የማረጋገጫ ኮድ', 'አረጋግጥ እና አንቃ', 'አልደረሰዎትም? እንደገና ላክ', 'ተመለስ', 'ጋሪ ይመልከቱ', 'የእርስዎ ጋሪ', 'የጠረጴዛ ቁጥር', 'ማስታወሻዎች (አማራጭ)', 'ጠቅላላ', 'ትዕዛዝ ወደ ወጥ ቤት ላክ', 'ዝጋ', 'ትዕዛዞቼ', 'የወጥ ቤት ዳሽቦርድ', 'አዲስ ትዕዛዞች', 'በዝግጅት ላይ', 'ለመውሰድ ዝግጁ', 'ቅንብሮች', 'የማሳወቂያ ድምጽ', 'ጨለማ ገጽታ', 'ቋንቋ'],
    ha: ['Dandanon gida, isa ko ina kake', 'Shiga', 'Ƙirƙiri Asusu', 'Abokin ciniki', "Ma'aikatan Girki", 'Suna', 'Imel', 'Lambar Waya', 'Kalmar Sirri', 'Shiga', 'Ƙirƙiri Asusu', 'Mun aika lambar lamba 6 zuwa wayarka', '. Shigar da ita a ƙasa don kunna asusunka.', 'Lambar Tabbatarwa', 'Tabbatar & Kunna', 'Ba ka samu ba? Sake aikawa', 'Baya', 'Duba Kwando', 'Kwandonka', 'Lambar Tebur', 'Bayanai (na zaɓi)', 'Jimla', 'Aika Oda zuwa Girki', 'Rufe', 'Odar da na yi', 'Dashboard na Girki', 'Sabbin Oda', 'Ana Shiryawa', 'A shirye don Karɓa', 'Saitunan', 'Sautin Sanarwa', 'Yanayin Duhu', 'Harshe'],
    pa: ['ਘਰ ਦਾ ਸੁਆਦ, ਜਿੱਥੇ ਵੀ ਤੁਸੀਂ ਹੋਵੋ', 'ਲੌਗ ਇਨ', 'ਖਾਤਾ ਬਣਾਓ', 'ਗਾਹਕ', 'ਰਸੋਈ ਸਟਾਫ਼', 'ਨਾਮ', 'ਈਮੇਲ', 'ਫ਼ੋਨ ਨੰਬਰ', 'ਪਾਸਵਰਡ', 'ਲੌਗ ਇਨ', 'ਖਾਤਾ ਬਣਾਓ', 'ਅਸੀਂ ਤੁਹਾਡੇ ਫ਼ੋਨ \'ਤੇ 6-ਅੰਕਾਂ ਦਾ ਕੋਡ ਭੇਜਿਆ ਹੈ', '। ਖਾਤਾ ਸਰਗਰਮ ਕਰਨ ਲਈ ਹੇਠਾਂ ਦਰਜ ਕਰੋ।', 'ਤਸਦੀਕ ਕੋਡ', 'ਤਸਦੀਕ ਕਰੋ ਅਤੇ ਸਰਗਰਮ ਕਰੋ', 'ਨਹੀਂ ਮਿਲਿਆ? ਦੁਬਾਰਾ ਭੇਜੋ', 'ਵਾਪਸ', 'ਕਾਰਟ ਵੇਖੋ', 'ਤੁਹਾਡਾ ਕਾਰਟ', 'ਮੇਜ਼ ਨੰਬਰ', 'ਨੋਟਸ (ਚੋਣਵਾਂ)', 'ਕੁੱਲ', 'ਆਰਡਰ ਰਸੋਈ ਨੂੰ ਭੇਜੋ', 'ਬੰਦ ਕਰੋ', 'ਮੇਰੇ ਆਰਡਰ', 'ਰਸੋਈ ਡੈਸ਼ਬੋਰਡ', 'ਨਵੇਂ ਆਰਡਰ', 'ਤਿਆਰ ਹੋ ਰਿਹਾ ਹੈ', 'ਲੈਣ ਲਈ ਤਿਆਰ', 'ਸੈਟਿੰਗਾਂ', 'ਸੂਚਨਾ ਧੁਨੀ', 'ਡਾਰਕ ਮੋਡ', 'ਭਾਸ਼ਾ'],
    ta: ['வீட்டு சுவை, நீங்கள் எங்கிருந்தாலும்', 'உள்நுழைய', 'கணக்கை உருவாக்கு', 'வாடிக்கையாளர்', 'சமையலறை ஊழியர்கள்', 'பெயர்', 'மின்னஞ்சல்', 'தொலைபேசி எண்', 'கடவுச்சொல்', 'உள்நுழைய', 'கணக்கை உருவாக்கு', 'உங்கள் தொலைபேசிக்கு 6 இலக்க குறியீட்டை அனுப்பியுள்ளோம்', '. கணக்கை செயல்படுத்த கீழே உள்ளிடவும்.', 'சரிபார்ப்பு குறியீடு', 'சரிபார்த்து செயல்படுத்து', 'கிடைக்கவில்லையா? மீண்டும் அனுப்பு', 'பின்செல்', 'கார்ட்டைக் காண்க', 'உங்கள் கார்ட்', 'மேசை எண்', 'குறிப்புகள் (விருப்பம்)', 'மொத்தம்', 'ஆர்டரை சமையலறைக்கு அனுப்பு', 'மூடு', 'எனது ஆர்டர்கள்', 'சமையலறை டாஷ்போர்டு', 'புதிய ஆர்டர்கள்', 'தயாராகிறது', 'எடுக்க தயாராக உள்ளது', 'அமைப்புகள்', 'அறிவிப்பு ஒலி', 'இருண்ட பயன்முறை', 'மொழி'],
    so: ['Dhadhanka guriga, meel kastoo aad joogto', 'Gal', 'Samee Akoon', 'Macmiil', 'Shaqaalaha Jikada', 'Magaca', 'Iimaylka', 'Lambarka Telefoonka', 'Furaha Sirta', 'Gal', 'Samee Akoon', 'Waxaan u dirnay koodh 6 xaraf ah taleefankaaga', '. Hoos ku qor si aad u firfircooniso akoonkaaga.', 'Koodhka Xaqiijinta', 'Xaqiiji & Firfircoonee', "Ma helin? Dib u dir", 'Dib u noqo', 'Eeg Gaarigga', 'Gaariggaaga', 'Lambarka Miiska', 'Faallooyin (ikhtiyaari)', 'Wadarta', 'Dalabka u dir Jikada', 'Xir', 'Dalabyadayda', 'Dashboard-ka Jikada', 'Dalabyo Cusub', 'Waa la diyaarinayaa', 'Diyaar u qaadasho', 'Dejinta', "Dhawaaqa Ogeysiiska", 'Muuqaalka Madow', 'Luqadda'],
  };

  const dict = {};
  LANGUAGES.forEach(({ code }) => {
    const row = ROWS[code] || ROWS.en;
    dict[code] = {};
    KEYS.forEach((key, i) => { dict[code][key] = row[i] ?? ROWS.en[i]; });
  });

  function currentLang() {
    return localStorage.getItem('shami_lang') || 'ar';
  }

  function applyLanguage(lang) {
    const t = dict[lang] || dict.ar;
    document.documentElement.lang = lang;
    document.documentElement.dir = RTL_LANGS.includes(lang) ? 'rtl' : 'ltr';
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.getAttribute('data-i18n');
      if (t[key]) el.textContent = t[key];
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
      const key = el.getAttribute('data-i18n-placeholder');
      if (t[key]) el.placeholder = t[key];
    });
  }

  window.ShamiI18n = { LANGUAGES, dict, currentLang, applyLanguage };

  document.addEventListener('DOMContentLoaded', () => applyLanguage(currentLang()));
})();
