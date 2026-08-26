export interface Plan {
  id: string
  name: string
  slug: string
  price: number
  currency: string
  maxChannels: number
  maxScheduledPosts: number | null // null = unlimited
  maxMediaMb: number
  allowRecurring: boolean
  features: string[]
  highlighted?: boolean
}

export const PLANS: Plan[] = [
  {
    id: 'plan_free',
    name: 'Free',
    slug: 'free',
    price: 0,
    currency: 'USD',
    maxChannels: 1,
    maxScheduledPosts: 10,
    maxMediaMb: 0,
    allowRecurring: false,
    features: [
      '1 Telegram channel',
      '10 scheduled posts/month',
      'Text posts only',
      'Basic scheduling',
      'Post history',
    ],
  },
  {
    id: 'plan_pro',
    name: 'Pro',
    slug: 'pro',
    price: 19,
    currency: 'USD',
    maxChannels: 5,
    maxScheduledPosts: 100,
    maxMediaMb: 100,
    allowRecurring: true,
    highlighted: true,
    features: [
      '5 Telegram channels',
      '100 scheduled posts/month',
      'Images & videos',
      'Recurring posts',
      'Timezone support',
      'Post analytics',
      'Priority support',
    ],
  },
  {
    id: 'plan_business',
    name: 'Business',
    slug: 'business',
    price: 49,
    currency: 'USD',
    maxChannels: 20,
    maxScheduledPosts: null,
    maxMediaMb: 500,
    allowRecurring: true,
    features: [
      '20 Telegram channels',
      'Unlimited scheduled posts',
      'Images & videos (500MB)',
      'Recurring posts',
      'Advanced analytics',
      'Priority support',
      'Team access (coming soon)',
    ],
  },
]
