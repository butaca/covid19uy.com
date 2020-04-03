import { library, dom } from '@fortawesome/fontawesome-svg-core'

import { faFacebook } from '@fortawesome/free-brands-svg-icons';
import { faTwitter } from '@fortawesome/free-brands-svg-icons';
import { faLinkedin } from '@fortawesome/free-brands-svg-icons';
import { faEnvelope } from '@fortawesome/free-solid-svg-icons';
import { faReddit } from '@fortawesome/free-brands-svg-icons';
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons';

library.add(faFacebook, faTwitter, faLinkedin, faEnvelope, faReddit, faWhatsapp);

import './home';

dom.watch();