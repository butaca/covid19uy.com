import { library, dom } from '@fortawesome/fontawesome-svg-core'

import { faFacebook, faTwitter, faLinkedin, faReddit, faWhatsapp } from '@fortawesome/free-brands-svg-icons';
import { faEnvelope, faLanguage } from '@fortawesome/free-solid-svg-icons';
import { faQuestionCircle } from '@fortawesome/free-regular-svg-icons';

library.add(faFacebook, faTwitter, faLinkedin, faReddit, faWhatsapp, faEnvelope, faLanguage, faQuestionCircle);

dom.watch();