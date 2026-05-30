import { User, Task, AccessLog, ApiKey } from './types';

export const MOCK_USERS: User[] = [
  {
    id: '1',
    name: 'Sarah Chen',
    email: 'sarah.c@worktrack.pro',
    role: 'Product Lead',
    status: 'active',
    lastActive: '2 mins ago',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBqsyhX-HrgMmoe3jd4DThbmyszrY-TJhFS38g0pxTAEhtF1OwynEldQ72mV207khM-txNDe53xDdcFAZgOSqV_crcOOzM1bml52kzTkOPU4s6bgZbRxoCAJrunLcNoKrewLYYZhjYSHG6GxIf55lzsB8-nl6TfjvAvkufKIgYwIKAQKUSFj0RsQhsIBSc1DFBgMJZlgnCooVzSHF_XMVW3Kd0R-X4OfW37bjNYej2N6mrpSeP0VvWNsEOvnnqv5YbrR0uDCWmy60t3'
  },
  {
    id: '2',
    name: 'Marcus Wright',
    email: 'm.wright@worktrack.pro',
    role: 'Designer',
    status: 'active',
    lastActive: '14 mins ago',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAP6GrpF8rS3zBla49NOklO5O2MDBvXoy0uBEWzBHf9_hfiQDIWE9iToGW8oOWmhzv4hquuKxMpkQDbSTcn6pG_xWvkXms_mDwppRgs4DvIsAqcbd4ml60XKdknTITE8b6Oh_NsrUdzJTvn0ynvHsyogYCiwK6v-VccgrLxakjexVAs_OGQTV3lo419sHc-BdJAa6997sifaWQnEDn-V0eYBSqSFHnIdIsWGfYARTdoWWMb7Uoqup_HYulTUTTd2NAW2b9-UvFojGa_'
  },
  {
    id: '3',
    name: 'Jordan Taylor',
    email: 'j.taylor@worktrack.pro',
    role: 'Developer',
    status: 'away',
    lastActive: '2 hours ago',
    avatar: '' // Will use initials
  },
  {
    id: '4',
    name: 'Elena Rodriguez',
    email: 'elena.r@worktrack.pro',
    role: 'HR Admin',
    status: 'offline',
    lastActive: 'Yesterday',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCL9X1X1-PE1ftL5OZ55TM0Oc6Bg-rkTEsW52Az4P_Is_jE8NBvAzt1LycM7r4yBCTmMpnWe31CNKvhkNVW48ncCBu3By0JHgDdJ6RTqaxmU-8euXK8XPbGHcd1Gu6geAutNFlVKaxo_oisCUj8AmbI-QJQitKfO5MWdDF2wQDV_LueqPz6BENT1SyrEwEHwY7gJiLe2pFsM7EyGBkMDvrL6kYsqpADRO1rG4YYoqeBKSEG4BqTaS2qma7r8-rJwJ0aCFUFf171jvzq'
  }
];

export const MOCK_TASKS: Task[] = [
  {
    id: '1',
    title: 'Curate Q4 Strategic Archive',
    description: 'Refining document taxonomy for archival storage.',
    priority: 'high',
    status: 'In Progress',
    dueDate: 'Oct 24, 2023',
    assignees: [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBNv8uLPfH7OlI7cIClLUWJYt1LHpJ4ojrIZBzIMEhss4nzMHWxslD9Y47CSdLijUilUocaYMQr-fd0smnpa8DhAlL3ncWyiKdfc5pqS6d2uOo8OL4XQg1YU2T9xkZxbe9lMMLvxHD3hjpIRmuVxLZuZ3tdbjZIzgdLwoBnKcJDIag8etyHrr3UNtg26TQ--JNA80FyvLWDaDg5U6AbQM650-e7FkQ24Fu9hbOVT0KiX3QPuYhL2nDjaQ-N1waIt-Zf56pzzYkynLVS',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCvAAd5HjpRjNu2oZZy40Ybwt3RqythNxdjtbSmrKU5rKhjd0ssrg-VDVjsPeJRX9kmlLI4Aogndfmjr1JL4MVK7mIQCIDLnJJ1chcwFPhEfNHthz_woq1Y4-XjVQKXgQ2_qnRSVJZch5gpRtl1ueO53eNhgzFdAZaeDptsSkbYr8UTIfvJvFqP0_FeghRKxYgp0Y9IbmeWkWLglsV5MoSBj0kqtA1ttwSfHDhdrbnYk8r0ZB056mIghLb6M1OGrOvol0kMmya5lAJJ'
    ],
    category: 'Operations'
  },
  {
    id: '2',
    title: 'System Audit: Permission Nodes',
    description: 'Validate end-to-end security for task curator access.',
    priority: 'medium',
    status: 'Review',
    dueDate: 'Oct 28, 2023',
    assignees: [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuC9Is_uIPo1HQVlDCk1NIcmCcBgOvIRqAHMCJdIKJEOe9hCLRSwgd-BpdTtCTsqD6Zr2YWrq4AvIOn5PPWxDJt4cZIDmShxmmpxPaPujvQarm9-IUPjnJO_x93T93SXhUiIlHinSt_A40JLNa5UfSGdp_jRbuTXukqlH9k_XsAHgWDG45FovO6txJJCGSm28KH3R67RjqH5_KCs5FYpb3zfRjxkHAliVLrwhxB4jh7c_I7zoN_1S6LyofxZcr53xSkHlbSl3z1-yMkb'
    ],
    category: 'Security'
  },
  {
    id: '3',
    title: 'Client Onboarding Framework',
    description: 'Redesigning the initial curation experience.',
    priority: 'low',
    status: 'To Do',
    dueDate: 'Nov 02, 2023',
    assignees: [],
    category: 'Product'
  },
  {
    id: '4',
    title: 'Brand Identity Synthesis',
    description: 'Merging visual assets for the curator portal.',
    priority: 'high',
    status: 'Completed',
    dueDate: 'Oct 20, 2023',
    assignees: [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDbxrmCEzAYZWU9xeF-Ox9976mGNWUMtyEGKL6H8V1PJ-IkeHm7Cx_yvmXQPTecsA5H88MaY6pkaJyLh7C8lJuC_UNmMUTQ7juxwSrFCTOMtKChVRPCN2Ush4EyjnpS9jYIf9b6ke4tOGAokPu1-vgvwIe0xuS4g35WOnc5Oi19F3kCE7U0qPlmK3z-WQ7KZl4KimknIS4PLMfyhuWAOxlc7bTUwi_Hog94jidFshl9G-toVNH1-QNyg-Am63IfF3WvEpFJif9Hxuxd'
    ],
    category: 'Design'
  }
];

export const MOCK_LOGS: AccessLog[] = [
  {
    id: '1',
    type: 'success',
    title: 'Successful Login',
    time: '12:45 PM',
    description: 'Alex Rivera logged in from IP 192.168.1.45 (macOS, Chrome)'
  },
  {
    id: '2',
    type: 'error',
    title: 'Invalid API Attempt',
    time: '10:12 AM',
    description: 'Unauthorized key WT_TEST_009 from external server (Frankfurt)'
  },
  {
    id: '3',
    type: 'export',
    title: 'Configuration Exported',
    time: '09:30 AM',
    description: 'System snapshot downloaded by sarah.c@worktrack.pro'
  }
];

export const MOCK_KEYS: ApiKey[] = [
  { id: '1', name: 'Production_Web_Main', key: 'wt_live_••••••••••••x7y2' },
  { id: '2', name: 'Staging_Internal_Test', key: 'wt_test_••••••••••••a9b1' }
];
