import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const LanguageContext = createContext(null);

const amharic = {
  'Overview': 'አጠቃላይ እይታ', 'Explore reports': 'ሪፖርቶችን ይመልከቱ', 'My assignments': 'የተመደቡልኝ ሥራዎች',
  'Admin': 'አስተዳደር', 'Categories': 'ምድቦች', 'Staff': 'ሠራተኞች', 'Report an issue': 'ችግር ያሳውቁ',
  'Sign in': 'ይግቡ', 'Sign out': 'ይውጡ', 'Super admin': 'ዋና አስተዳዳሪ', 'Administrator': 'አስተዳዳሪ', 'Resident': 'ነዋሪ',
  'NEIGHBORHOOD ACTION': 'የሰፈር ተሳትፎ', 'Small fixes. Stronger neighborhoods.': 'ትንንሽ ለውጦች፤ የተሻሉ ሰፈሮች።',
  'Community-powered · Locally focused': 'በማኅበረሰብ የሚመራ · ለአካባቢው የተዘጋጀ',
  'YOUR NEIGHBORHOOD, IN MOTION': 'ሰፈርዎ በእንቅስቃሴ ላይ ነው',
  'Good places don’t': 'ጥሩ ሰፈሮች', 'happen ': 'በአጋጣሚ', 'by accident.': 'አይፈጠሩም።',
  'See something that needs attention? Bring it to the people who can help — and follow every fix along the way.': 'ትኩረት የሚሻ ችግር አይተዋል? ሊያግዙ ለሚችሉ አካላት ያሳውቁ፤ እስኪፈታም ድረስ ሂደቱን ይከታተሉ።',
  'Report a problem': 'ችግር ያሳውቁ', 'Built around your community': 'ለማኅበረሰብዎ የተዘጋጀ', 'Local issues. Visible progress.': 'የአካባቢ ችግሮች፤ ግልጽ መሻሻል።',
  'Here’s what’s happening': 'በአካባቢዎ ያለው ሁኔታ', 'Real reports from your community': 'ከማኅበረሰብዎ የቀረቡ እውነተኛ ሪፖርቶች',
  'Updating community pulse…': 'የአካባቢው ሁኔታ በመጫን ላይ…', 'Live counts unavailable · Retry': 'የቀጥታ መረጃ አልተገኘም · እንደገና ይሞክሩ',
  'total reports': 'ጠቅላላ ሪፖርቶች', 'being addressed': 'በመፍትሄ ላይ ያሉ', 'resolved': 'የተፈቱ', 'See all activity': 'ሁሉንም እንቅስቃሴ ይመልከቱ',
  'YOUR NEIGHBORS ARE ON IT': 'ጎረቤቶችዎ በመሳተፍ ላይ ናቸው', 'Fresh from the community': 'አዲስ የማኅበረሰብ ሪፖርቶች',
  'Every report is a small act of looking out for each other.': 'እያንዳንዱ ሪፖርት ለጎረቤቶቻችን ያለንን እንክብካቤ ያሳያል።',
  'View all reports': 'ሁሉንም ሪፖርቶች ይመልከቱ', 'Fetching the latest reports…': 'አዳዲስ ሪፖርቶችን በመጫን ላይ…',
  'Be the first to speak up': 'የመጀመሪያው ያሳውቁ', 'Share something that needs attention in your neighborhood.': 'በሰፈርዎ ትኩረት የሚሻ ችግር ካለ ያሳውቁ።',
  'A BETTER BLOCK STARTS HERE': 'የተሻለ ሰፈር ከዚህ ይጀምራል', 'Small steps.': 'ትንንሽ እርምጃዎች።', 'Visible progress.': 'ግልጽ መሻሻል።',
  'FixNearMe brings community members and local teams together around the things that make daily life better.': 'FixNearMe የማኅበረሰቡን ነዋሪዎችና የአካባቢ ቡድኖችን በጋራ በማሰባሰብ የዕለት ተዕለት ኑሮን ያሻሽላል።',
  'Bring something to light': 'ችግርን ያሳውቁ', 'Spot it': 'ችግሩን ይመልከቱ', 'Report a local issue with a few helpful details.': 'ጠቃሚ ዝርዝሮችን በማከል የአካባቢ ችግርን ያሳውቁ።',
  'We’re in it together': 'በጋራ እንሠራለን', 'Neighbors can confirm issues and help raise visibility.': 'ጎረቤቶች ችግሩን በማረጋገጥ ትኩረት እንዲያገኝ ሊያግዙ ይችላሉ።',
  'Watch progress': 'መሻሻሉን ይከታተሉ', 'Follow updates from first report to resolution.': 'ከመጀመሪያው ሪፖርት እስከ መፍትሄው ያሉ ዝማኔዎችን ይከታተሉ።',
  'ONE NEIGHBORHOOD AT A TIME': 'አንድ ሰፈር በአንድ ጊዜ', 'What could be better': 'ከቤትዎ ውጭ', 'right outside your door?': 'ምን ሊሻሻል ይችላል?', 'Let’s make it better': 'በጋራ እናሻሽለው',
  'Search reports': 'ሪፖርቶችን ይፈልጉ', 'All statuses': 'ሁሉም ሁኔታዎች', 'Reported': 'ሪፖርት ተደርጓል', 'Under review': 'በግምገማ ላይ', 'In progress': 'በሂደት ላይ', 'Pending verification': 'ማረጋገጫ በመጠባበቅ ላይ', 'Resolved': 'ተፈትቷል', 'Closed': 'ተዘግቷል',
  'All categories': 'ሁሉም ምድቦች', 'All priorities': 'ሁሉም የቅድሚያ ደረጃዎች', 'Low': 'ዝቅተኛ', 'Medium': 'መካከለኛ', 'High': 'ከፍተኛ', 'Urgent': 'አስቸኳይ',
  'Neighborhood': 'ሰፈር', 'Apply': 'ተግብር', 'Clear': 'አጽዳ', 'FILTER BY': 'አጣራ', 'List': 'ዝርዝር', 'Map': 'ካርታ', 'Previous': 'ቀዳሚ', 'Next': 'ቀጣይ', 'Page': 'ገጽ',
  'reports in the community': 'ሪፖርቶች በማኅበረሰቡ', 'Looking through community reports…': 'የማኅበረሰቡን ሪፖርቶች በመፈለግ ላይ…',
  'No reports match those filters': 'ከዚህ ማጣሪያ ጋር የሚዛመድ ሪፖርት የለም', 'Nothing reported yet': 'እስካሁን ሪፖርት አልቀረበም',
  'Try broadening your search or clearing a filter.': 'ፍለጋዎን ያስፋፉ ወይም ማጣሪያውን ያጥፉ።', 'Be the first to share something that needs attention.': 'ትኩረት የሚሻውን ችግር በመጀመሪያ ያሳውቁ።',
  'MAKE IT VISIBLE': 'ችግሩን ያሳውቁ', 'Report a problem': 'ችግር ያሳውቁ', 'A few clear details help your local team understand what’s happening and where.': 'ግልጽ ዝርዝሮች የአካባቢ ቡድኑ ችግሩንና ቦታውን እንዲረዳ ያግዛሉ።',
  'What’s going on?': 'ምን ችግር ተፈጥሯል?', 'Tell us what you noticed. Keep it clear and specific.': 'ያዩትን ችግር በግልጽና በተለየ መንገድ ይግለጹ።',
  'Report title': 'የሪፖርቱ ርዕስ', 'Description': 'የችግሩ መግለጫ', 'Type of issue': 'የችግሩ ዓይነት', 'Choose a category': 'ምድብ ይምረጡ',
  'Help us find it': 'ቦታውን እንድናገኝ ያግዙን', 'A neighborhood and landmark give the team a good starting point.': 'የሰፈሩ ስምና አቅራቢያ ያለ ቦታ ቡድኑ ችግሩን እንዲያገኝ ያግዛሉ።',
  'Nearby landmark': 'አቅራቢያ ያለ መለያ ቦታ', 'Photo of the problem': 'የችግሩ ፎቶ', 'Add a photo': 'ፎቶ ያክሉ', 'Browse': 'ይምረጡ', 'Remove photo': 'ፎቶውን ያስወግዱ',
  'Pinpoint the problem': 'የችግሩን ቦታ ያመልክቱ', 'Share your device location while you’re at the issue. Your browser will ask you to allow access.': 'ችግሩ ባለበት ቦታ ላይ ሳሉ የስልክዎን ቦታ ያጋሩ። አሳሹ ፈቃድ እንዲሰጡ ይጠይቅዎታል።',
  'Use my current location': 'አሁን ያለሁበትን ቦታ ይጠቀሙ', 'Update my location': 'ቦታዬን ያድሱ', 'Finding your location…': 'ቦታዎን በማግኘት ላይ…',
  'Problem location is attached to this report': 'የችግሩ ቦታ ከሪፖርቱ ጋር ተያይዟል', 'Adjust the pin on the map': 'ምልክቱን በካርታው ላይ ያስተካክሉ', 'Choose the problem location on a map': 'በካርታው ላይ የችግሩን ቦታ ይምረጡ',
  'Click the map to place or move the pin. If you can’t share device location, you can still choose the spot here.': 'ምልክቱን ለማስቀመጥ ወይም ለማንቀሳቀስ ካርታውን ይጫኑ። የስልክ ቦታዎን ማጋራት ካልቻሉ ቦታውን እዚህ መምረጥ ይችላሉ።',
  'Check for similar reports': 'ተመሳሳይ ሪፖርቶችን ይፈልጉ', 'Checking nearby reports…': 'አቅራቢያ ያሉ ሪፖርቶችን በመፈተሽ ላይ…', 'Submit report': 'ሪፖርቱን ያስገቡ', 'Sending report…': 'ሪፖርቱን በመላክ ላይ…',
  'WELCOME BACK': 'እንኳን ደህና መጡ', 'JOIN YOUR COMMUNITY': 'ከማኅበረሰብዎ ጋር ይቀላቀሉ', 'Good to see you again.': 'እንደገና ስላየንዎት ደስ ብሎናል።', 'Let’s make things better.': 'በጋራ እናሻሽል።',
  'Sign in to check on your reports and stay part of the conversation.': 'ሪፖርቶችዎን ለመከታተልና በውይይቱ ውስጥ ለመሳተፍ ይግቡ።', 'Create a resident account to confirm reports and follow local progress.': 'ሪፖርቶችን ለማረጋገጥና የአካባቢውን መሻሻል ለመከታተል የነዋሪ መለያ ይክፈቱ።',
  'Full name': 'ሙሉ ስም', 'Email address': 'የኢሜይል አድራሻ', 'Password': 'የይለፍ ቃል', 'Your name': 'ስምዎ', 'Your password': 'የይለፍ ቃልዎ', 'Hide password': 'የይለፍ ቃሉን ደብቅ', 'Show password': 'የይለፍ ቃሉን አሳይ',
  'At least 10 characters': 'ቢያንስ 10 ቁምፊዎች', 'Use at least 10 characters.': 'ቢያንስ 10 ቁምፊዎችን ይጠቀሙ።', 'One moment…': 'እባክዎ ትንሽ ይጠብቁ…', 'Create resident account': 'የነዋሪ መለያ ይክፈቱ',
  'Already have an account?': 'መለያ አለዎት?', 'New to FixNearMe?': 'FixNearMeን አዲስ ነዎት?', 'Create an account': 'መለያ ይክፈቱ', 'Account access is protected and role-based.': 'የመለያ ደህንነት በሚና ፈቃድ ይጠበቃል።', 'Back to FixNearMe': 'ወደ FixNearMe ይመለሱ', 'Residents · Local staff · Shared progress': 'ነዋሪዎች · የአካባቢ ሠራተኞች · የጋራ መሻሻል',
  'Couldn’t load this right now': 'አሁን መጫን አልተቻለም', 'Retry': 'እንደገና ይሞክሩ', 'Nothing here yet': 'እስካሁን ምንም የለም', 'When there is an update, it will show up here.': 'ዝማኔ ሲኖር እዚህ ይታያል።', 'Recently': 'በቅርቡ', 'confirmations': 'ማረጋገጫዎች',
  'All reports': 'ሁሉም ሪፖርቶች', 'Reported ': 'ሪፖርት የተደረገበት ', 'Photo submitted with this report': 'ከዚህ ሪፖርት ጋር የቀረበ ፎቶ', 'Know this needs attention too?': 'ይህም ችግር ትኩረት እንደሚፈልግ ያውቃሉ?',
  'Confirming helps your neighbors and local team understand the impact.': 'ማረጋገጥዎ ጎረቤቶችዎና የአካባቢው ቡድን የችግሩን ተፅዕኖ እንዲረዱ ያግዛል።', 'Confirming…': 'በማረጋገጥ ላይ…', 'I see this too': 'እኔም ይህን አይቻለሁ', 'Sign in to confirm': 'ለማረጋገጥ ይግቡ',
  'SOMETHING SIMILAR?': 'ተመሳሳይ ችግር አለ?', 'Related reports nearby': 'አቅራቢያ ያሉ ተዛማጅ ሪፖርቶች', 'Suggestions only': 'ጥቆማዎች ብቻ', 'PROGRESS SO FAR': 'እስካሁኑ ያለው መሻሻል', 'Report timeline': 'የሪፖርቱ ታሪክ',
  'Just getting started': 'ሂደቱ ገና ተጀምሯል', 'Updates will appear here as the report moves forward.': 'ሪፖርቱ እየተሻሻለ ሲሄድ ዝርዝሮች እዚህ ይታያሉ።', 'Every update is accountable': 'እያንዳንዱ ዝማኔ ተመዝግቦ ይቆያል', 'Changes are recorded so neighbors can follow progress clearly.': 'ጎረቤቶች መሻሻሉን በግልጽ እንዲከታተሉ ለውጦች ይመዘገባሉ።',
  'Notifications': 'ማሳወቂያዎች', 'Mark all read': 'ሁሉንም እንደተነበቡ ምልክት አድርግ', 'No notifications yet': 'እስካሁን ማሳወቂያ የለም', 'New reports and assignments will appear here.': 'አዳዲስ ሪፖርቶችና የሥራ ምደባዎች እዚህ ይታያሉ።', 'New community report': 'አዲስ የማኅበረሰብ ሪፖርት', 'A report was assigned to you': 'ሪፖርት ተመድቦልዎታል',
  'Your report will be visible to the community.': 'ሪፖርትዎ ለማኅበረሰቡ ይታያል።', 'Back to overview': 'ወደ መነሻ ይመለሱ', 'Open menu': 'ምናሌውን ክፈት', 'Close menu': 'ምናሌውን ዝጋ',
  'Streetlight': 'የመንገድ መብራት', 'Water leak': 'የውሃ ፍሳሽ', 'Road damage': 'የመንገድ ጉዳት', 'Drainage': 'የፍሳሽ ማስወገጃ', 'Waste': 'ቆሻሻ', 'Sidewalk': 'የእግረኛ መንገድ', 'Other': 'ሌላ',
  'Good places don’t happen by accident.': 'ጥሩ ሰፈሮች በአጋጣሚ አይፈጠሩም።', 'Built around your community': 'ለማኅበረሰብዎ የተዘጋጀ', 'Local issues. Visible progress.': 'የአካባቢ ችግሮች፤ ግልጽ መሻሻል።',
  'YOUR NEIGHBORS ARE ON IT': 'ጎረቤቶችዎ በመሳተፍ ላይ ናቸው', 'FixNearMe brings community members and local teams together around the things that make daily life better.': 'FixNearMe የማኅበረሰቡን ነዋሪዎችና የአካባቢ ቡድኖችን በጋራ በማሰባሰብ የዕለት ተዕለት ኑሮን ያሻሽላል።',
  'Report a local issue with a few helpful details.': 'ጠቃሚ ዝርዝሮችን በማከል የአካባቢ ችግርን ያሳውቁ።', 'Follow updates from first report to resolution.': 'ከመጀመሪያው ሪፖርት እስከ መፍትሄው ያሉ ዝማኔዎችን ይከታተሉ።',
  'What could be better right outside your door?': 'ከቤትዎ ውጭ ምን ሊሻሻል ይችላል?', 'Let’s make it better': 'በጋራ እናሻሽለው', 'New report': 'አዲስ ሪፖርት', 'Search': 'ፈልግ', 'Search reports, places, or details…': 'ሪፖርቶችን፣ ቦታዎችን ወይም ዝርዝሮችን ይፈልጉ…',
  'COMMUNITY ACTIVITY': 'የማኅበረሰብ እንቅስቃሴ', 'See what your neighbors are reporting and follow the work as it gets done.': 'ጎረቤቶችዎ ምን እያሳወቁ እንደሆነ ይመልከቱ፤ ሥራውም እየተከናወነ ሲሄድ ይከታተሉ።', 'Category': 'ምድብ', 'Status': 'ሁኔታ', 'Priority': 'ቅድሚያ', 'Report view': 'የሪፖርት እይታ',
  'latest': 'የቅርብ ጊዜ', 'of': 'ከ', 'without a location': 'ቦታ ያልተገለጸ', 'No reports in this view include a map location yet. Try another filter or view.': 'በዚህ እይታ በካርታ ላይ የተመለከተ ቦታ ያለው ሪፖርት የለም። ሌላ ማጣሪያ ወይም እይታ ይሞክሩ።',
  'OPTIONAL': 'አማራጭ', 'characters': 'ቁምፊዎች', 'e.g. Streetlight out on Maple Avenue': 'ለምሳሌ፦ በአንድ መንገድ ላይ የጎዳና መብራት ጠፍቷል', 'What happened? When did you first notice it? Any details that could help the team find it?': 'ምን ተፈጠረ? መቼ አስተዋሉት? ቡድኑ ቦታውን እንዲያገኝ የሚረዳ ሌላ ዝርዝር አለ?',
  'A helpful description gets the right attention.': 'ግልጽ መግለጫ ችግሩ ትክክለኛ ትኩረት እንዲያገኝ ይረዳል።', 'e.g. Bole': 'ለምሳሌ፦ ቦሌ', 'A building, shop, school, or nearby street': 'ሕንፃ፣ ሱቅ፣ ትምህርት ቤት ወይም አቅራቢያ ያለ መንገድ', 'For example, “opposite Bole clinic entrance”.': 'ለምሳሌ፦ “ከቦሌ ጤና ጣቢያ መግቢያ በስተቃራኒ”.',
  'Photo of the problem': 'የችግሩ ፎቶ', 'up to 5 MB': 'እስከ 5 ሜባ', 'Preview of the image attached to this report': 'ከሪፖርቱ ጋር የተያያዘው ፎቶ ቅድመ እይታ', 'A clear photo helps the local team understand what to look for. Please avoid including people’s faces.': 'ግልጽ ፎቶ የአካባቢው ቡድን ችግሩን እንዲረዳ ያግዛል። እባክዎ የሰዎችን ፊት በፎቶው ውስጥ አያካትቱ።',
  'Problem location selected. Click somewhere else on the map to move the pin.': 'የችግሩ ቦታ ተመርጧል። ምልክቱን ለማንቀሳቀስ በካርታው ላይ ሌላ ቦታ ይጫኑ።', 'Location is not available in this browser.': 'በዚህ አሳሽ የቦታ አገልግሎት አይገኝም።', 'Current location added': 'አሁን ያሉበት ቦታ ተጨምሯል', 'meters accuracy': 'ሜትር ትክክለኛነት', 'Location permission was denied. Allow location access in your browser, or place the pin on the map.': 'የቦታ ፈቃድ አልተሰጠም። በአሳሹ ላይ ፈቃድ ይስጡ ወይም ምልክቱን በካርታው ላይ ያስቀምጡ።', 'Could not get your location. Try selecting a point on the map.': 'ቦታዎን ማግኘት አልተቻለም። በካርታው ላይ ቦታ ለመምረጥ ይሞክሩ።',
  'Please use at least 5 characters.': 'እባክዎ ቢያንስ 5 ቁምፊዎችን ይጠቀሙ።', 'Add at least 10 characters so the team knows what to look for.': 'ቡድኑ ምን እንደሚፈልግ እንዲረዳ ቢያንስ 10 ቁምፊዎችን ያክሉ።', 'Choose an active issue category.': 'ንቁ የችግር ምድብ ይምረጡ።', 'Enter the neighborhood.': 'የሰፈሩን ስም ያስገቡ።', 'We couldn’t check for similar reports': 'ተመሳሳይ ሪፖርቶችን መፈተሽ አልተቻለም', 'You can still submit your report.': 'አሁንም ሪፖርትዎን ማስገባት ይችላሉ።', 'No close matches found. Your report is ready to go.': 'በጣም የሚቀራረብ ሪፖርት አልተገኘም። ሪፖርትዎን ማስገባት ይችላሉ።',
  'Make an account': 'መለያ ይክፈቱ', 'Thanks for confirming this report. Your support helps the team see what matters.': 'ይህን ሪፖርት ስላረጋገጡ እናመሰግናለን። ድጋፍዎ ቡድኑ ትኩረት የሚሻውን እንዲለይ ያግዛል።', 'You’ve already confirmed this report.': 'ይህን ሪፖርት አስቀድመው አረጋግጠዋል።', 'Opening report…': 'ሪፖርቱን በመክፈት ላይ…', 'Back to reports': 'ወደ ሪፖርቶች ይመለሱ', 'Reported': 'ሪፖርት ተደርጓል', 'Completion photo approved by an admin': 'የጥገና ፎቶው በአስተዳዳሪ ጸድቋል', 'Completion photo submitted for admin review': 'የጥገና ፎቶው ለአስተዳዳሪ ግምገማ ቀርቧል', 'You’re all caught up': 'ሁሉንም ማሳወቂያዎች አይተዋል', 'unread': 'ያልተነበቡ', 'Unread': 'ያልተነበበ', 'Just now': 'አሁን',
  'Notifications are temporarily unavailable.': 'ማሳወቂያዎች ለጊዜው አይገኙም።', 'Could not update notifications. Try again.': 'ማሳወቂያዎችን ማዘመን አልተቻለም። እንደገና ይሞክሩ።',
  'FixNearMe CIVIC INTELLIGENCE': 'FixNearMe የማኅበረሰብ መረጃ', 'FIXNEARME CIVIC INTELLIGENCE': 'FixNearMe የማኅበረሰብ መረጃ', 'Priority brief': 'የቅድሚያ ማጠቃለያ', 'Awaiting signal': 'መረጃ በመጠባበቅ ላይ', 'Assistive signal only. Staff should review the report before deciding how to respond.': 'ይህ ለድጋፍ የቀረበ መረጃ ብቻ ነው። ምላሽ ከመስጠታቸው በፊት ሠራተኞች ሪፖርቱን መገምገም አለባቸው።',
  'Keep good work moving.': 'መልካም ሥራውን ያስቀጥሉ።', 'Review community reports, coordinate your staff, and make sure every issue has an owner.': 'የማኅበረሰቡን ሪፖርቶች ይገምግሙ፣ ሠራተኞችን ያስተባብሩ፣ እያንዳንዱም ችግር ኃላፊ እንዲኖረው ያረጋግጡ።', 'Review community reports and keep each update clear and accountable.': 'የማኅበረሰቡን ሪፖርቶች ይገምግሙ፤ እያንዳንዱ ዝማኔ ግልጽና ተጠያቂነት ያለው እንዲሆን ያድርጉ።',
  'Gathering community activity…': 'የማኅበረሰቡን እንቅስቃሴ በመሰብሰብ ላይ…', 'THE COMMUNITY QUEUE': 'የማኅበረሰቡ የሪፖርት ዝርዝር', 'Reports that need a response': 'ምላሽ የሚፈልጉ ሪፖርቶች', 'Reports are ranked by their explainable civic signal.': 'ሪፖርቶች በግልጽ ሊብራራ በሚችል የማኅበረሰብ ቅድሚያ ይደረደራሉ።',
  'Report categories': 'የሪፖርት ምድቦች', 'Create and maintain the categories residents use to classify local problems.': 'ነዋሪዎች የአካባቢ ችግሮችን ለመመደብ የሚጠቀሙባቸውን ምድቦች ይፍጠሩና ያስተዳድሩ።', 'Staff management': 'የሠራተኞች አስተዳደር', 'Create category-specialized staff accounts and review their current workloads.': 'በምድብ የተካኑ የሠራተኛ መለያዎችን ይፍጠሩ፤ ያሉባቸውን ሥራዎችም ይከታተሉ።',
  'YOUR WORK QUEUE': 'የሥራ ዝርዝርዎ', 'The next good fix starts here.': 'ቀጣዩ መልካም መፍትሄ ከዚህ ይጀምራል።', 'You can only view and update reports assigned to your staff account. Upload a completion photo to request resolution.': 'ለርስዎ የተመደቡ ሪፖርቶችን ብቻ ማየትና ማዘመን ይችላሉ። ችግሩ መፈታቱን ለማረጋገጥ የጥገና ፎቶ ይስቀሉ።', 'Staff view': 'የሠራተኛ እይታ',
  'Assigned to you': 'ለእርስዎ የተመደቡ', 'Awaiting review': 'ግምገማ በመጠባበቅ ላይ', 'Approved fixes': 'የጸደቁ ጥገናዎች', 'YOUR ASSIGNED REPORTS': 'ለእርስዎ የተመደቡ ሪፖርቶች', 'Work on the block': 'በሰፈሩ ያሉ ሥራዎች', 'Urgent and older reports are shown first.': 'አስቸኳይና ቆይታ ያላቸው ሪፖርቶች በመጀመሪያ ይታያሉ።', 'Loading your assignments…': 'የተመደቡልዎትን ሥራዎች በመጫን ላይ…', 'No reports assigned yet': 'እስካሁን ሪፖርት አልተመደበልዎትም', 'Reports assigned to you will appear here.': 'ለእርስዎ የሚመደቡ ሪፖርቶች እዚህ ይታያሉ።',
  'Immediate review': 'አስቸኳይ ግምገማ', 'Elevated signal': 'ከፍ ያለ ቅድሚያ', 'Needs attention': 'ትኩረት ይፈልጋል', 'Routine review': 'መደበኛ ግምገማ',
  'Possible immediate safety hazard': 'አስቸኳይ የደህንነት አደጋ ሊኖር ይችላል', 'Possible public health or water risk': 'የሕዝብ ጤና ወይም የውሃ አደጋ ሊኖር ይችላል', 'Could block safe access or essential routes': 'ደህንነቱ የተጠበቀ መዳረሻ ወይም ዋና መንገዶች ሊዘጋ ይችላል',
  'Review the safety risk and dispatch the appropriate team.': 'የደህንነት አደጋውን ይገምግሙና ተገቢውን ቡድን ይላኩ።', 'Review for public health impact and prioritize a field check.': 'በሕዝብ ጤና ላይ ያለውን ተፅዕኖ ይገምግሙና የቦታ ምርመራን ቅድሚያ ይስጡ።', 'Multiple neighbors report this issue; consider prioritizing a site visit.': 'በርካታ ጎረቤቶች ይህን ችግር አሳውቀዋል፤ ቦታውን መጎብኘት ቅድሚያ ይስጡ።', 'This issue has waited several days; check assignment and next steps.': 'ይህ ችግር ለብዙ ቀናት ቆይቷል፤ ምደባውንና ቀጣይ እርምጃዎቹን ይመልከቱ።', 'Review the report and route it to the responsible category team.': 'ሪፖርቱን ይገምግሙና ኃላፊነቱ ላለው የምድብ ቡድን ያስተላልፉ።',
  'A GOOD REPORT HELPS': 'ጥሩ ሪፖርት ያግዛል', 'Small details make a big difference.': 'ትንንሽ ዝርዝሮች ትልቅ ለውጥ ያመጣሉ።', 'Include a nearby landmark or describe when you noticed the issue. It helps your neighbors and local teams act with confidence.': 'አቅራቢያ ያለ መለያ ቦታ ያክሉ ወይም ችግሩን መቼ እንዳዩ ይግለጹ። ይህ ጎረቤቶችዎና የአካባቢ ቡድኖች በእርግጠኝነት እንዲሠሩ ያግዛል።',
  'What happens next?': 'ቀጥሎ ምን ይሆናል?', 'Your report appears in the community feed.': 'ሪፖርትዎ በማኅበረሰቡ ዝርዝር ውስጥ ይታያል።', 'Neighbors can confirm if they’ve seen it too.': 'ጎረቤቶችም ችግሩን እንዳዩ ሊያረጋግጡ ይችላሉ።', 'Local staff share updates as work progresses.': 'ሥራው እየተከናወነ ሲሄድ የአካባቢ ሠራተኞች ዝማኔ ያጋራሉ።', 'Report submissions are public. Avoid adding personal or sensitive information.': 'የሪፖርት ይዘቶች ለሕዝብ ይታያሉ። የግል ወይም ሚስጥራዊ መረጃ አያክሉ።',
  'Staff account created. Share the initial password securely.': 'የሠራተኛ መለያ ተፈጥሯል። የመጀመሪያ የይለፍ ቃሉን በደህና ያጋሩ።', 'PEOPLE POWERING THE FIX': 'መፍትሄውን የሚያስችሉ ሰዎች', 'Staff accounts': 'የሠራተኛ መለያዎች', 'Each staff account is linked to one report category.': 'እያንዳንዱ የሠራተኛ መለያ ከአንድ የሪፖርት ምድብ ጋር ይገናኛል።', 'team members': 'የቡድን አባላት', 'Loading staff…': 'ሠራተኞችን በመጫን ላይ…', 'No category': 'ምድብ የለም', 'assigned': 'ተመድቧል', 'Active': 'ንቁ', 'Paused': 'ታግዷል', 'No staff accounts': 'የሠራተኛ መለያ የለም', 'Create an account for the people who will resolve reported problems.': 'የቀረቡ ችግሮችን ለሚፈቱ ሰዎች መለያ ይፍጠሩ።', 'Add a staff member': 'ሠራተኛ ያክሉ', 'Staff can be assigned reports from this category.': 'ከዚህ ምድብ ያሉ ሪፖርቶች ለሠራተኛው ሊመደቡ ይችላሉ።', 'Staff member name': 'የሠራተኛው ስም', 'Report category': 'የሪፖርት ምድብ', 'Initial password': 'የመጀመሪያ የይለፍ ቃል', 'At least 12 characters': 'ቢያንስ 12 ቁምፊዎች', 'Share it privately. Password changes and resets are not available in this first version.': 'በግል ያጋሩት። በዚህ የመጀመሪያ ስሪት የይለፍ ቃልን መቀየር ወይም ማደስ አይቻልም።', 'Creating account…': 'መለያ በመፍጠር ላይ…', 'Create staff account': 'የሠራተኛ መለያ ይፍጠሩ', 'Saved': 'ተቀምጧል',
  'Category name': 'የምድቡ ስም', 'What kinds of problems fit here?': 'እዚህ ምን ዓይነት ችግሮች ይመደባሉ?', 'Key': 'መለያ ቁልፍ', 'reports': 'ሪፖርቶች', 'staff': 'ሠራተኞች', 'Archived': 'ተቀምጧል', 'Archive': 'ወደ ማህደር አስገባ', 'Restore': 'መልስ', 'REPORT CLASSIFICATION': 'የሪፖርት ምደባ', 'Active categories appear in report forms and staff setup. Archiving keeps existing report history.': 'ንቁ ምድቦች በሪፖርት ቅጾችና በሠራተኛ ምደባ ይታያሉ። ምድብን ወደ ማህደር ማስገባት የቆየ ታሪክን ያስቀምጣል።', 'active': 'ንቁ', 'Category created.': 'ምድቡ ተፈጥሯል።', 'Loading categories…': 'ምድቦችን በመጫን ላይ…', 'No categories': 'ምድቦች የሉም', 'Create a report category to start classifying issues.': 'ችግሮችን ለመመደብ የሪፖርት ምድብ ይፍጠሩ።', 'Add a category': 'ምድብ ያክሉ', 'A short name will generate a stable key for saved reports.': 'አጭር ስም ለተቀመጡ ሪፖርቶች ቋሚ መለያ ቁልፍ ይፈጥራል።', 'e.g. Public parks': 'ለምሳሌ፦ የሕዝብ መናፈሻዎች', 'Creating…': 'በመፍጠር ላይ…', 'Create category': 'ምድብ ይፍጠሩ',
};

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    try { return localStorage.getItem('fixnearme_language') === 'am' ? 'am' : 'en'; } catch { return 'en'; }
  });
  useEffect(() => {
    document.documentElement.lang = language;
    try { localStorage.setItem('fixnearme_language', language); } catch { /* Storage may be disabled. */ }
  }, [language]);
  const value = useMemo(() => ({
    language,
    setLanguage,
    toggleLanguage: () => setLanguage((current) => current === 'en' ? 'am' : 'en'),
    t: (text) => language === 'am' ? (amharic[text] || text) : text,
    locale: language === 'am' ? 'am-ET' : 'en-US',
  }), [language]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used inside LanguageProvider.');
  return context;
}
