import fs from "fs";
import path from "path";
import crypto from "crypto";
import { getSupabaseAdminClient } from "@/lib/supabase";
import { deriveGatePin } from "@/lib/compliance";
import {
  BringItem,
  EventItem,
  GuestRsvp,
  Order,
  PaymentChannel,
  RsvpStatus,
} from "@/types/database";

interface PullThruStoreData {
  events: EventItem[];
  rsvps: GuestRsvp[];
  orders: Order[];
}

const DATA_FILE_PATH = path.join(process.cwd(), ".pullthru-data.json");

let memoryCache: PullThruStoreData | null = null;
let diskWritable = true;

function getInitialSeedData(): PullThruStoreData {
  const events: EventItem[] = [
    {
      id: "evt-1",
      profile_id: "prof-tariq",
      host_name: "Tariq Davids",
      host_handle: "tariq",
      host_phone: "+27825550101",
      host_bank_name: "Capitec Bank",
      host_account_number: "1648291045",
      capitec_payme_url: "https://payme.capitecbank.co.za/payme/tariq-davids-fives",
      paystack_subaccount_code: "ACCT_za_tariq_01",
      settlement_schedule: "auto",
      slug: "thursday-fives-sandton",
      mode: "fixed",
      category_vibe: "⚽ 5-a-Side / Padel",
      title: "Thursday Night 5-a-Side @ Fives Futbol Sandton",
      description:
        "No more last-minute flaky dropouts! Lock your spot in with R100 via Direct PayShap or 1-Tap Capitec PayMe (R0 Guest Fee) so Pitch 3 is paid upfront. Winners get bragging rights and first round at the clubhouse.",
      price_zar: 100,
      min_pot_contribution_zar: undefined,
      target_pot_zar: null,
      tiers: [],
      bring_items: [
        {
          id: "b1",
          label: "⚽ Match Ball & Pump",
          claimed_by_name: "Siya K",
          claimed_rsvp_id: "rsvp-1",
        },
        {
          id: "b2",
          label: "🦺 Bibs (Neon Set)",
          claimed_by_name: "Marco V",
          claimed_rsvp_id: "rsvp-2",
        },
        {
          id: "b3",
          label: "🧊 10x Energades / Water",
          claimed_by_name: null,
          claimed_rsvp_id: null,
        },
      ],
      custom_question: null,
      hide_amounts_on_wall: false,
      allow_payday_promise: false,
      event_date: "Thursday, 29 Oct • 19:00 SAST",
      location_name: "Fives Futbol Sandton, Pitch 3",
      secret_location_pin: "Pitch 3 Gate Code: #4491 — Kickoff 19:00 sharp",
      max_spots: 10,
      is_active: true,
      host_secret_token: "host-secret-tariq-fives",
      created_at: "2026-10-18T09:00:00Z",
    },
    {
      id: "evt-2",
      profile_id: "prof-riaan",
      host_name: "Riaan van der Merwe",
      host_handle: "riaan",
      host_phone: "+27835550202",
      host_bank_name: "FNB",
      host_account_number: "62819203948",
      paystack_subaccount_code: "ACCT_za_riaan_02",
      settlement_schedule: "auto",
      slug: "bokke-test-spitbraai",
      mode: "tiered",
      category_vibe: "🥩 Braai & Potjie",
      title: "Bokke vs NZ Saturday Spitbraai & Big Screen",
      description:
        "Whole Karoo lamb going on the spit from 11am! Big projector screen in the lapa for kickoff at 17:00. Pick your tier below so we order exact meat & dop quantities from the butcher.",
      price_zar: 220,
      min_pot_contribution_zar: undefined,
      target_pot_zar: null,
      tiers: [
        {
          id: "t1",
          label: "🥩 Full Lamb Spitbraai + Cooler Box Dop",
          description:
            "All meat, roosterkoek, sides & ice cold beers/ciders",
          price_zar: 220,
        },
        {
          id: "t2",
          label: "🥗 Spitbraai Meat & Sides Only (No Alcohol)",
          description: "Full lamb spit + sides & soft drinks",
          price_zar: 140,
        },
        {
          id: "t3",
          label: "🔥 Sides & Ice Only (Bring Own Meat/Halaal)",
          description: "Pap, sous, garlic bread, salads & ice",
          price_zar: 60,
        },
        {
          id: "t4",
          label: "🧒 Laaities / Kids Under 12 (Mahala)",
          description: "Boerie roll & juice",
          price_zar: 0,
        },
      ],
      bring_items: [
        {
          id: "sb1",
          label: "🧊 6x Bags of Party Ice",
          claimed_by_name: "Bongani M",
          claimed_rsvp_id: "rsvp-b1",
        },
        {
          id: "sb2",
          label: "🔥 3x Bags Sekelbos Wood",
          claimed_by_name: "Jaco P",
          claimed_rsvp_id: "rsvp-b2",
        },
        {
          id: "sb3",
          label: "🍮 Tannie's Malva Pudding & Custard",
          claimed_by_name: null,
          claimed_rsvp_id: null,
        },
        {
          id: "sb4",
          label: "🔊 JBL PartyBox Speaker",
          claimed_by_name: null,
          claimed_rsvp_id: null,
        },
      ],
      custom_question: "What are you drinking & any halaal/veg notes?",
      hide_amounts_on_wall: false,
      allow_payday_promise: true,
      event_date: "Saturday, 31 Oct • 14:30 SAST",
      location_name: "Riaan's Lapa, Centurion",
      secret_location_pin:
        "42 Kiepersol Crescent, Irene, Centurion — Security code #8820",
      max_spots: 20,
      is_active: true,
      host_secret_token: "host-secret-riaan-braai",
      created_at: "2026-10-18T11:30:00Z",
    },
    {
      id: "evt-3",
      profile_id: "prof-mbali",
      host_name: "Mbali Khumalo",
      host_handle: "mbali",
      host_phone: "+27725550303",
      host_bank_name: "Standard Bank",
      host_account_number: "0012398471",
      paystack_subaccount_code: "ACCT_za_mbali_03",
      settlement_schedule: "auto",
      slug: "mrs-dlamini-baby-shower",
      mode: "pot",
      category_vibe: "🎁 Gift / Umgalelo Pot",
      title: "Zanele's Surprise Baby Shower & Yuppiechef Pram Pot 🍼",
      description:
        "We are spoiling mama-to-be Zanele with the Thule Urban Glide pram & Yuppiechef voucher! Individual Rand amounts are hidden on the public wall so everyone can contribute comfortably from R50+.",
      price_zar: 150,
      min_pot_contribution_zar: 50,
      target_pot_zar: 3000,
      tiers: [],
      bring_items: [
        {
          id: "bs1",
          label: "🧁 Cupcake Tower (Pastel Yellow)",
          claimed_by_name: "Tannie Elize",
          claimed_rsvp_id: "rsvp-p2",
        },
        {
          id: "bs2",
          label: "🎈 Helium Balloon Garland",
          claimed_by_name: "Chloe B",
          claimed_rsvp_id: "rsvp-p5",
        },
        {
          id: "bs3",
          label: "🍾 3x Non-Alcoholic Sparkling Rosé",
          claimed_by_name: null,
          claimed_rsvp_id: null,
        },
      ],
      custom_question: "Leave a blessing or parenting tip for Zanele's card!",
      hide_amounts_on_wall: true,
      allow_payday_promise: true,
      event_date: "Sunday, 1 Nov • 11:00 SAST",
      location_name: "The Secret Tea Garden, Morningside",
      secret_location_pin:
        "Pergola Table 4 at The Secret Tea Garden — arrive by 10:45 before Zanele!",
      max_spots: null,
      is_active: true,
      host_secret_token: "host-secret-mbali-pot",
      created_at: "2026-10-19T08:15:00Z",
    },
    {
      id: "evt-4",
      profile_id: "prof-chloe",
      host_name: "Chloe Botha",
      host_handle: "chloe",
      host_phone: "+27845550404",
      host_bank_name: "Discovery Bank",
      host_account_number: "4092837465",
      paystack_subaccount_code: "ACCT_za_chloe_04",
      settlement_schedule: "auto",
      slug: "clifton-sunset-catamaran",
      mode: "fixed",
      category_vibe: "⛵ Groove / Boat / Party",
      title: "Chloe's 25th Mirage Sunset Catamaran & Clifton Picnic",
      description:
        "Private charter out of the V&A Waterfront to anchor off Clifton 4th for sunset! Welcome MCC & grazing platters included. Strictly 16 spots on the catamaran deck — once it's full, it's full.",
      price_zar: 250,
      min_pot_contribution_zar: undefined,
      target_pot_zar: null,
      tiers: [],
      bring_items: [
        {
          id: "cat1",
          label: "🕶️ Disposable Film Cameras",
          claimed_by_name: "Zinhle K",
          claimed_rsvp_id: "rsvp-c1",
        },
        {
          id: "cat2",
          label: "🍓 Extra Strawberries & MCC",
          claimed_by_name: null,
          claimed_rsvp_id: null,
        },
      ],
      custom_question: "What sunset house / amapiano track must be on the playlist?",
      hide_amounts_on_wall: false,
      allow_payday_promise: false,
      event_date: "Saturday, 7 Nov • 16:30 SAST",
      location_name: "V&A Waterfront Pierhead -> Clifton 4th",
      secret_location_pin:
        "Quay 5 Charter Jetty (next to Life Grand Cafe) — Boarding 16:30 sharp!",
      max_spots: 16,
      is_active: true,
      host_secret_token: "host-secret-chloe-boat",
      created_at: "2026-10-19T12:00:00Z",
    },
    {
      id: "evt-5",
      profile_id: "prof-sbu",
      host_name: "Sbu & Chloe",
      host_handle: "seapointrun",
      host_phone: "+27765550505",
      host_bank_name: "Capitec Bank",
      paystack_subaccount_code: "ACCT_za_sbu_05",
      settlement_schedule: "auto",
      slug: "seapoint-sunrise-run-club",
      mode: "free",
      category_vibe: "🏃 Run Club / Free RSVP",
      title: "Saturday 5km Sea Point Prom Run + Brekkie Roll Call",
      description:
        "Conversational 5:30/km social pace from Sea Point Pavilion to Saunders Rock and back, followed by flat whites & croissants. Free RSVP so we can book the right table size for coffee after!",
      price_zar: 0,
      min_pot_contribution_zar: undefined,
      target_pot_zar: null,
      tiers: [],
      bring_items: [
        {
          id: "rc1",
          label: "📸 Film Camera for Crew Shots",
          claimed_by_name: "Keegan V",
          claimed_rsvp_id: "rsvp-rc1",
        },
        {
          id: "rc2",
          label: "🍊 Bag of Naartjies for Finish",
          claimed_by_name: null,
          claimed_rsvp_id: null,
        },
      ],
      custom_question: "Joining for post-run coffee & brekkie after?",
      hide_amounts_on_wall: false,
      allow_payday_promise: false,
      event_date: "Saturday, 24 Oct • 07:00 SAST",
      location_name: "Sea Point Pavilion Clock, 07:00 AM",
      secret_location_pin:
        "Meet right under the Pavilion Clock — post-run table booked at Bootlegger Three Anchor Bay",
      max_spots: 30,
      is_active: true,
      host_secret_token: "host-secret-sbu-run",
      created_at: "2026-10-19T15:00:00Z",
    },
  ];

  const rsvps: GuestRsvp[] = [
    // Event 1: thursday-fives-sandton — 7 Guest RSVPs covering 8 spots locked
    {
      id: "rsvp-1",
      order_id: "ord-1",
      event_id: "evt-1",
      guest_name: "Siya K",
      plus_one_names: [],
      spots_locked: 1,
      tier_label: null,
      amount_contributed_zar: 100,
      status: "locked_paid",
      payment_channel: "capitec_pay",
      badge_label: "⚽ Midfield General",
      comment: "Bringing the match ball pumped properly this week boys 🔥",
      claimed_item_id: "b1",
      claimed_item_label: "⚽ Match Ball & Pump",
      custom_answer: null,
      is_anonymous_on_wall: false,
      checked_in: true,
      swap_token: "swap-fives-siya",
      created_at: "2026-10-19T10:05:00Z",
    },
    {
      id: "rsvp-2",
      order_id: "ord-2",
      event_id: "evt-1",
      guest_name: "Marco V (+1: Luca)",
      plus_one_names: ["Luca"],
      spots_locked: 2,
      tier_label: null,
      amount_contributed_zar: 200,
      status: "locked_paid",
      payment_channel: "apple_pay",
      badge_label: "⚡ Top Bins Striker",
      comment: "Washed the neon bibs finally 😂 Luca is playing keeper!",
      claimed_item_id: "b2",
      claimed_item_label: "🦺 Bibs (Neon Set)",
      custom_answer: null,
      is_anonymous_on_wall: false,
      checked_in: true,
      swap_token: "swap-fives-marco",
      created_at: "2026-10-19T10:18:00Z",
    },
    {
      id: "rsvp-3",
      order_id: "ord-3",
      event_id: "evt-1",
      guest_name: "Tshepo M",
      plus_one_names: [],
      spots_locked: 1,
      tier_label: null,
      amount_contributed_zar: 100,
      status: "locked_paid",
      payment_channel: "capitec_pay",
      badge_label: "🧱 No-Nonsense Defender",
      comment: "No nutmegs allowed tonight gents, locked in!",
      claimed_item_id: null,
      claimed_item_label: null,
      custom_answer: null,
      is_anonymous_on_wall: false,
      checked_in: false,
      swap_token: "swap-fives-tshepo",
      created_at: "2026-10-19T11:02:00Z",
    },
    {
      id: "rsvp-4",
      order_id: "ord-4",
      event_id: "evt-1",
      guest_name: "Previn N",
      plus_one_names: [],
      spots_locked: 1,
      tier_label: null,
      amount_contributed_zar: 100,
      status: "locked_paid",
      payment_channel: "card",
      badge_label: "🎯 Playmaker",
      comment: "Capitec Pay took 4 seconds, way better than chasing EFTs!",
      claimed_item_id: null,
      claimed_item_label: null,
      custom_answer: null,
      is_anonymous_on_wall: false,
      checked_in: false,
      swap_token: "swap-fives-previn",
      created_at: "2026-10-19T12:15:00Z",
    },
    {
      id: "rsvp-5",
      order_id: "ord-5",
      event_id: "evt-1",
      guest_name: "Jabu Z",
      plus_one_names: [],
      spots_locked: 1,
      tier_label: null,
      amount_contributed_zar: 100,
      status: "locked_paid",
      payment_channel: "capitec_pay",
      badge_label: "🔥 Here for the Gees",
      comment: "Diski time! Losers buy Castle Lites after.",
      claimed_item_id: null,
      claimed_item_label: null,
      custom_answer: null,
      is_anonymous_on_wall: false,
      checked_in: false,
      swap_token: "swap-fives-jabu",
      created_at: "2026-10-19T13:40:00Z",
    },
    {
      id: "rsvp-6",
      order_id: "ord-6",
      event_id: "evt-1",
      guest_name: "Liam S",
      plus_one_names: [],
      spots_locked: 1,
      tier_label: null,
      amount_contributed_zar: 100,
      status: "locked_paid",
      payment_channel: "apple_pay",
      badge_label: "🧤 Sweeper Keeper",
      comment: "Pulling through straight from Alice Lane office!",
      claimed_item_id: null,
      claimed_item_label: null,
      custom_answer: null,
      is_anonymous_on_wall: false,
      checked_in: false,
      swap_token: "swap-fives-liam",
      created_at: "2026-10-19T14:20:00Z",
    },
    {
      id: "rsvp-7",
      order_id: null,
      event_id: "evt-1",
      guest_name: "Uncle Bruce (Paid Cash to Tariq)",
      plus_one_names: [],
      spots_locked: 1,
      tier_label: null,
      amount_contributed_zar: 100,
      status: "cash_logged",
      payment_channel: "cash_manual",
      badge_label: "💵 Cash Legend",
      comment: "Gave Tariq a crisp R100 Mandela note at gym this morning.",
      claimed_item_id: null,
      claimed_item_label: null,
      custom_answer: null,
      is_anonymous_on_wall: false,
      checked_in: true,
      swap_token: "swap-fives-bruce",
      created_at: "2026-10-19T15:10:00Z",
    },

    // Event 2: bokke-test-spitbraai — 5 Guest RSVPs covering 8 headcount
    {
      id: "rsvp-b1",
      order_id: "ord-b1",
      event_id: "evt-2",
      guest_name: "Bongani M",
      plus_one_names: ["Thando M"],
      spots_locked: 2,
      tier_label: "🥩 Full Lamb Spitbraai + Cooler Box Dop",
      amount_contributed_zar: 440,
      status: "locked_paid",
      payment_channel: "capitec_pay",
      badge_label: "🥩 Braai Master Sponsor",
      comment: "Bokke by 12! Bringing 6 bags of party ice for the baths 🇿🇦🦌",
      claimed_item_id: "sb1",
      claimed_item_label: "🧊 6x Bags of Party Ice",
      custom_answer: "Castle Lite & Savanna Dry, no dietary issues",
      is_anonymous_on_wall: false,
      checked_in: true,
      swap_token: "swap-braai-bongani",
      created_at: "2026-10-19T09:30:00Z",
    },
    {
      id: "rsvp-b2",
      order_id: "ord-b2",
      event_id: "evt-2",
      guest_name: "Jaco P",
      plus_one_names: ["Annelie P", "Klein Jaco"],
      spots_locked: 3,
      tier_label: "🥩 Full Lamb Spitbraai + Cooler Box Dop",
      amount_contributed_zar: 440,
      status: "locked_paid",
      payment_channel: "eft",
      badge_label: "🔥 Sekelbos Supplier",
      comment: "Nou gaan ons braai! Got 3 bags of dry Sekelbos in the bakkie.",
      claimed_item_id: "sb2",
      claimed_item_label: "🔥 3x Bags Sekelbos Wood",
      custom_answer: "Brandy & Coke + Appletiser for the laaitie",
      is_anonymous_on_wall: false,
      checked_in: false,
      swap_token: "swap-braai-jaco",
      created_at: "2026-10-19T11:15:00Z",
    },
    {
      id: "rsvp-b3",
      order_id: "ord-b3",
      event_id: "evt-2",
      guest_name: "Zayd Abrahams",
      plus_one_names: [],
      spots_locked: 1,
      tier_label: "🔥 Sides & Ice Only (Bring Own Meat/Halaal)",
      amount_contributed_zar: 60,
      status: "locked_paid",
      payment_channel: "apple_pay",
      badge_label: "🇿🇦 Green & Gold Gees",
      comment: "Love that there's a sides-only tier! Bringing halaal lamb chops for the separate grid.",
      claimed_item_id: null,
      claimed_item_label: null,
      custom_answer: "Halaal meat on clean grid please legend!",
      is_anonymous_on_wall: false,
      checked_in: false,
      swap_token: "swap-braai-zayd",
      created_at: "2026-10-19T13:05:00Z",
    },
    {
      id: "rsvp-b4",
      order_id: "ord-b4",
      event_id: "evt-2",
      guest_name: "Chantel V",
      plus_one_names: [],
      spots_locked: 1,
      tier_label: "🥗 Spitbraai Meat & Sides Only (No Alcohol)",
      amount_contributed_zar: 140,
      status: "locked_paid",
      payment_channel: "capitec_pay",
      badge_label: "🥂 Designated Driver Hero",
      comment: "Can't wait for Riaan's legendary roosterkoek!",
      claimed_item_id: null,
      claimed_item_label: null,
      custom_answer: "Sparkling water & Coke Zero",
      is_anonymous_on_wall: false,
      checked_in: false,
      swap_token: "swap-braai-chantel",
      created_at: "2026-10-19T16:40:00Z",
    },
    {
      id: "rsvp-b5",
      order_id: null,
      event_id: "evt-2",
      guest_name: "Pieter & Mignon",
      plus_one_names: [],
      spots_locked: 1,
      tier_label: "🥩 Full Lamb Spitbraai + Cooler Box Dop",
      amount_contributed_zar: 0,
      status: "payday_promise",
      payment_channel: "capitec_pay",
      badge_label: "🗓️ Payday Pledge (Standby)",
      comment: "Locked in! Settling as soon as salary hits on the 25th 🙌",
      claimed_item_id: null,
      claimed_item_label: null,
      custom_answer: "Windhoek Draught",
      is_anonymous_on_wall: false,
      checked_in: false,
      swap_token: "swap-braai-pieter",
      created_at: "2026-10-19T18:00:00Z",
    },

    // Event 3: mrs-dlamini-baby-shower — 6 Guest RSVPs totaling R2,150
    {
      id: "rsvp-p1",
      order_id: "ord-p1",
      event_id: "evt-3",
      guest_name: "Aunty Zodwa",
      plus_one_names: [],
      spots_locked: 1,
      tier_label: null,
      amount_contributed_zar: 500,
      status: "locked_paid",
      payment_channel: "capitec_pay",
      badge_label: "💝 Village Elder Blessing",
      comment: "uNkulunkulu abusise umntwana wakho Zanele! We are so proud of you.",
      claimed_item_id: null,
      claimed_item_label: null,
      custom_answer: "Sleep when the baby sleeps my child!",
      is_anonymous_on_wall: false,
      checked_in: true,
      swap_token: "swap-pot-zodwa",
      created_at: "2026-10-19T09:10:00Z",
    },
    {
      id: "rsvp-p2",
      order_id: "ord-p2",
      event_id: "evt-3",
      guest_name: "Tannie Elize",
      plus_one_names: [],
      spots_locked: 1,
      tier_label: null,
      amount_contributed_zar: 450,
      status: "locked_paid",
      payment_channel: "eft",
      badge_label: "🧁 Sweetest Blessing",
      comment: "So excited for your little bundle of joy! Baking my lemon cupcakes too.",
      claimed_item_id: "bs1",
      claimed_item_label: "🧁 Cupcake Tower (Pastel Yellow)",
      custom_answer: "Accept every offer of frozen meals in month one!",
      is_anonymous_on_wall: false,
      checked_in: false,
      swap_token: "swap-pot-elize",
      created_at: "2026-10-19T10:45:00Z",
    },
    {
      id: "rsvp-p3",
      order_id: "ord-p3",
      event_id: "evt-3",
      guest_name: "Anushka P",
      plus_one_names: [],
      spots_locked: 1,
      tier_label: null,
      amount_contributed_zar: 400,
      status: "locked_paid",
      payment_channel: "apple_pay",
      badge_label: "🍼 Pram Pot Champion",
      comment: "Love that this pot keeps individual amounts private! Can't wait to celebrate you.",
      claimed_item_id: null,
      claimed_item_label: null,
      custom_answer: "Zip-up baby grows only — never buttons at 3am!",
      is_anonymous_on_wall: false,
      checked_in: false,
      swap_token: "swap-pot-anushka",
      created_at: "2026-10-19T12:20:00Z",
    },
    {
      id: "rsvp-p4",
      order_id: "ord-p4",
      event_id: "evt-3",
      guest_name: "Nomsa M",
      plus_one_names: [],
      spots_locked: 1,
      tier_label: null,
      amount_contributed_zar: 350,
      status: "locked_paid",
      payment_channel: "capitec_pay",
      badge_label: "✨ Godmother Vibes",
      comment: "Halala Mama Dlamini! Counting down the days till we meet baby.",
      claimed_item_id: null,
      claimed_item_label: null,
      custom_answer: "Take lots of videos of the newborn stretches!",
      is_anonymous_on_wall: false,
      checked_in: false,
      swap_token: "swap-pot-nomsa",
      created_at: "2026-10-19T14:00:00Z",
    },
    {
      id: "rsvp-p5",
      order_id: "ord-p5",
      event_id: "evt-3",
      guest_name: "Chloe B",
      plus_one_names: [],
      spots_locked: 1,
      tier_label: null,
      amount_contributed_zar: 450,
      status: "locked_paid",
      payment_channel: "card",
      badge_label: "🎈 Decor Queen",
      comment: "Bringing the balloon garland early at 10:15am! So much love for you Zanele 💛",
      claimed_item_id: "bs2",
      claimed_item_label: "🎈 Helium Balloon Garland",
      custom_answer: "You are going to be the coolest mom!",
      is_anonymous_on_wall: false,
      checked_in: false,
      swap_token: "swap-pot-chloe",
      created_at: "2026-10-19T15:30:00Z",
    },
    {
      id: "rsvp-p6",
      order_id: null,
      event_id: "evt-3",
      guest_name: "Keegan V (Payday 25th Promise)",
      plus_one_names: [],
      spots_locked: 1,
      tier_label: null,
      amount_contributed_zar: 0,
      status: "payday_promise",
      payment_channel: "capitec_pay",
      badge_label: "🗓️ Payday 25th Pledge",
      comment: "Pledging R150 for the pram pot on the 25th! Congrats guys!",
      claimed_item_id: null,
      claimed_item_label: null,
      custom_answer: "Wishing you endless naps!",
      is_anonymous_on_wall: false,
      checked_in: false,
      swap_token: "swap-pot-keegan",
      created_at: "2026-10-19T17:15:00Z",
    },

    // Event 4: clifton-sunset-catamaran — 13 spots locked out of 16
    {
      id: "rsvp-c1",
      order_id: "ord-c1",
      event_id: "evt-4",
      guest_name: "Zinhle K (+1: Lindi)",
      plus_one_names: ["Lindi"],
      spots_locked: 2,
      tier_label: null,
      amount_contributed_zar: 500,
      status: "locked_paid",
      payment_channel: "apple_pay",
      badge_label: "🍾 Sunset VIP",
      comment: "Clifton 4th sunset on a catamaran?! Say less! Bringing 2 film cameras 📸",
      claimed_item_id: "cat1",
      claimed_item_label: "🕶️ Disposable Film Cameras",
      custom_answer: "Black Coffee - Drive",
      is_anonymous_on_wall: false,
      checked_in: true,
      swap_token: "swap-cat-zinhle",
      created_at: "2026-10-19T12:15:00Z",
    },
    {
      id: "rsvp-c2",
      order_id: "ord-c2",
      event_id: "evt-4",
      guest_name: "Josh M (+2 Crew)",
      plus_one_names: ["Devon", "Matt"],
      spots_locked: 3,
      tier_label: null,
      amount_contributed_zar: 750,
      status: "locked_paid",
      payment_channel: "capitec_pay",
      badge_label: "⛵ Deck Captain",
      comment: "The boys are locked in! Happy 25th Chloe 🥂",
      claimed_item_id: null,
      claimed_item_label: null,
      custom_answer: "Kabza De Small & Kelvin Momo",
      is_anonymous_on_wall: false,
      checked_in: false,
      swap_token: "swap-cat-josh",
      created_at: "2026-10-19T13:10:00Z",
    },
    {
      id: "rsvp-c3",
      order_id: "ord-c3",
      event_id: "evt-4",
      guest_name: "Bianca R (+1: Mia)",
      plus_one_names: ["Mia"],
      spots_locked: 2,
      tier_label: null,
      amount_contributed_zar: 500,
      status: "locked_paid",
      payment_channel: "card",
      badge_label: "🌅 Golden Hour Crew",
      comment: "Outfits already planned! Best birthday idea ever.",
      claimed_item_id: null,
      claimed_item_label: null,
      custom_answer: "Shimza sunset set",
      is_anonymous_on_wall: false,
      checked_in: false,
      swap_token: "swap-cat-bianca",
      created_at: "2026-10-19T14:25:00Z",
    },
    {
      id: "rsvp-c4",
      order_id: "ord-c4",
      event_id: "evt-4",
      guest_name: "Thabo N (+2)",
      plus_one_names: ["Kagiso", "Lerato"],
      spots_locked: 3,
      tier_label: null,
      amount_contributed_zar: 750,
      status: "locked_paid",
      payment_channel: "capitec_pay",
      badge_label: "🥂 MCC Sponsor",
      comment: "Paid for all 3 of us so nobody misses the boat literally 😂",
      claimed_item_id: null,
      claimed_item_label: null,
      custom_answer: "Oscar Mbo - Yes God",
      is_anonymous_on_wall: false,
      checked_in: false,
      swap_token: "swap-cat-thabo",
      created_at: "2026-10-19T15:50:00Z",
    },
    {
      id: "rsvp-c5",
      order_id: "ord-c5",
      event_id: "evt-4",
      guest_name: "Savannah D (+2)",
      plus_one_names: ["Tayla", "Kirsten"],
      spots_locked: 3,
      tier_label: null,
      amount_contributed_zar: 750,
      status: "locked_paid",
      payment_channel: "apple_pay",
      badge_label: "💃 Groove Specialist",
      comment: "Only 3 spots left now!! Hurry up everyone else 🔥",
      claimed_item_id: null,
      claimed_item_label: null,
      custom_answer: "Rüfüs Du Sol - Innerbloom",
      is_anonymous_on_wall: false,
      checked_in: false,
      swap_token: "swap-cat-savannah",
      created_at: "2026-10-19T17:05:00Z",
    },

    // Event 5: seapoint-sunrise-run-club — 4 Free RSVPs
    {
      id: "rsvp-rc1",
      order_id: null,
      event_id: "evt-5",
      guest_name: "Keegan V",
      plus_one_names: [],
      spots_locked: 1,
      tier_label: null,
      amount_contributed_zar: 0,
      status: "going_free",
      payment_channel: "capitec_pay",
      badge_label: "📸 Pacer & Photographer",
      comment: "Bringing the Olympus point-and-shoot for sunrise prom shots!",
      claimed_item_id: "rc1",
      claimed_item_label: "📸 Film Camera for Crew Shots",
      custom_answer: "100% in for almond croissants after",
      is_anonymous_on_wall: false,
      checked_in: true,
      swap_token: "swap-run-keegan",
      created_at: "2026-10-19T16:00:00Z",
    },
    {
      id: "rsvp-rc2",
      order_id: null,
      event_id: "evt-5",
      guest_name: "Ayanda S",
      plus_one_names: [],
      spots_locked: 1,
      tier_label: null,
      amount_contributed_zar: 0,
      status: "going_free",
      payment_channel: "capitec_pay",
      badge_label: "🏃‍♀️ 5:30/km Cruiser",
      comment: "Best way to start a Saturday in Cape Town 🌊☀️",
      claimed_item_id: null,
      claimed_item_label: null,
      custom_answer: "Yes! Iced oat latte please",
      is_anonymous_on_wall: false,
      checked_in: false,
      swap_token: "swap-run-ayanda",
      created_at: "2026-10-19T16:30:00Z",
    },
    {
      id: "rsvp-rc3",
      order_id: null,
      event_id: "evt-5",
      guest_name: "Luke B",
      plus_one_names: [],
      spots_locked: 1,
      tier_label: null,
      amount_contributed_zar: 0,
      status: "going_free",
      payment_channel: "apple_pay",
      badge_label: "☕ Here for the Flat White",
      comment: "Running strictly for the Bootlegger brekkie afterwards.",
      claimed_item_id: null,
      claimed_item_label: null,
      custom_answer: "Count me in for coffee",
      is_anonymous_on_wall: false,
      checked_in: false,
      swap_token: "swap-run-luke",
      created_at: "2026-10-19T17:45:00Z",
    },
    {
      id: "rsvp-rc4",
      order_id: null,
      event_id: "evt-5",
      guest_name: "Naledi M",
      plus_one_names: [],
      spots_locked: 1,
      tier_label: null,
      amount_contributed_zar: 0,
      status: "going_free",
      payment_channel: "capitec_pay",
      badge_label: "🌅 Sunrise Runner",
      comment: "Pulling through from Gardens! See you at the clock at 07:00.",
      claimed_item_id: null,
      claimed_item_label: null,
      custom_answer: "Yes for brekkie!",
      is_anonymous_on_wall: false,
      checked_in: false,
      swap_token: "swap-run-naledi",
      created_at: "2026-10-19T18:20:00Z",
    },
  ];

  const orders: Order[] = rsvps
    .filter((r) => r.status === "locked_paid" && r.order_id)
    .map((r, idx) => {
      const ev = events.find((e) => e.id === r.event_id);
      const basePriceCents = Math.round((r.amount_contributed_zar || 0) * 100);
      const platformFeeCents =
        basePriceCents <= 0
          ? 0
          : basePriceCents <= 40000
          ? Math.round(basePriceCents * 0.05) + 200
          : Math.round(basePriceCents * 0.04) + 200;
      const totalChargedCents = basePriceCents + platformFeeCents;
      const phoneDigits = `2782${String(1112233 + idx).padStart(7, "0")}`;
      const matchedTier =
        ev?.tiers.find((t) => t.label === r.tier_label) || null;
      const cleanBuyerName = r.guest_name.replace(/\s*\(\+\d+.*\)$/, "");

      return {
        id: r.order_id!,
        event_id: r.event_id,
        profile_id: ev?.profile_id || "prof-tariq",
        buyer_name: cleanBuyerName,
        buyer_whatsapp: `+${phoneDigits}`,
        buyer_email: `wa_${phoneDigits}@rsvp.pullthru.co.za`,
        is_synthetic_email: true,
        spots_count: r.spots_locked || 1,
        plus_one_names: r.plus_one_names || [],
        tier_id: matchedTier ? matchedTier.id : null,
        tier_label: r.tier_label,
        base_price_cents: r.order_id === "ord-1" ? 10000 : basePriceCents,
        platform_fee_cents: r.order_id === "ord-1" ? 700 : platformFeeCents,
        total_charged_cents: r.order_id === "ord-1" ? 10700 : totalChargedCents,
        paystack_reference:
          r.order_id === "ord-1"
            ? "PT_SEED_FIVES_01"
            : `PT_SEED_${r.order_id!.toUpperCase().replace(/[^A-Z0-9]/g, "_")}`,
        payment_channel: r.payment_channel,
        settled_to_host: true,
        cpa_s49_accepted: true,
        status: "paid",
        created_at: r.created_at,
      };
    });

  return { events, rsvps, orders };
}

function loadLocalStore(): PullThruStoreData {
  if (memoryCache && !diskWritable) {
    return memoryCache;
  }

  // Stateless Edge Guard: Cloudflare Workers and serverless Edge runtimes do not have persistent local disk
  if (process.env.NODE_ENV === "production") {
    if (!memoryCache) {
      memoryCache = getInitialSeedData();
    }
    return memoryCache;
  }

  try {
    if (fs.existsSync(DATA_FILE_PATH)) {
      const raw = fs.readFileSync(DATA_FILE_PATH, "utf-8");
      const parsed = JSON.parse(raw) as PullThruStoreData;
      if (
        parsed &&
        Array.isArray(parsed.events) &&
        parsed.events.length > 0 &&
        Array.isArray(parsed.rsvps) &&
        Array.isArray(parsed.orders)
      ) {
        const seeded = getInitialSeedData();
        let mutated = false;
        const ord1 = parsed.orders.find((o) => o.id === "ord-1");
        if (ord1 && (ord1.platform_fee_cents !== 700 || ord1.total_charged_cents !== 10700)) {
          ord1.base_price_cents = 10000;
          ord1.platform_fee_cents = 700;
          ord1.total_charged_cents = 10700;
          mutated = true;
        }
        for (const seedOrd of seeded.orders) {
          if (!parsed.orders.some((o) => o.id === seedOrd.id)) {
            parsed.orders.push(seedOrd);
            mutated = true;
          }
        }
        if (mutated) {
          saveLocalStore(parsed);
        }
        memoryCache = parsed;
        return parsed;
      }
    }
  } catch {
    // Fallback to memory cache or seed data if read fails
  }

  if (memoryCache) {
    return memoryCache;
  }

  const seeded = getInitialSeedData();
  memoryCache = seeded;
  saveLocalStore(seeded);
  return seeded;
}

function saveLocalStore(data: PullThruStoreData): void {
  memoryCache = data;

  // Stateless Edge Guard: Cloudflare Workers run in stateless V8 isolates; avoid local disk I/O in production
  if (process.env.NODE_ENV === "production") {
    diskWritable = false;
    return;
  }

  let tempPath: string | null = null;
  try {
    tempPath = `${DATA_FILE_PATH}.${process.pid}.${Date.now()}-${Math.random().toString(36).slice(2, 7)}.tmp`;
    fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), "utf-8");
    try {
      fs.renameSync(tempPath, DATA_FILE_PATH);
    } catch {
      // Fallback for Windows file lock: direct copy and unlink
      fs.copyFileSync(tempPath, DATA_FILE_PATH);
      if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
    }
    diskWritable = true;
  } catch {
    // Graceful fallback to in-memory cache if filesystem is read-only or rename is locked
    diskWritable = false;
    if (tempPath) {
      try {
        if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
      } catch {
        // Ignore unlink error
      }
    }
  }
}

function getServerSealKey(): Buffer {
  const rawSecret =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.YOCO_SECRET_KEY ||
    "pullthru-local-dev-key-v1";
  return crypto.createHash("sha256").update(rawSecret).digest();
}

export function sealDbSecret(plaintext: string | null | undefined): string | null | undefined {
  if (!plaintext || typeof plaintext !== "string") return plaintext;
  if (plaintext.startsWith("PTSEAL:")) return plaintext;
  try {
    const key = getServerSealKey();
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
    const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
    const tag = cipher.getAuthTag();
    return `PTSEAL:${iv.toString("base64url")}.${tag.toString("base64url")}.${encrypted.toString("base64url")}`;
  } catch {
    return plaintext;
  }
}

export function unsealDbSecret(sealed: string | null | undefined): string | null | undefined {
  if (!sealed || typeof sealed !== "string") return sealed;
  if (!sealed.startsWith("PTSEAL:")) return sealed;
  try {
    const body = sealed.slice("PTSEAL:".length);
    const [ivB64, tagB64, encB64] = body.split(".");
    if (!ivB64 || !tagB64 || !encB64) return sealed;
    const key = getServerSealKey();
    const iv = Buffer.from(ivB64, "base64url");
    const tag = Buffer.from(tagB64, "base64url");
    const encrypted = Buffer.from(encB64, "base64url");
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(tag);
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return decrypted.toString("utf8");
  } catch {
    return sealed;
  }
}

function stripEventRollups(ev: Partial<EventItem>): Record<string, unknown> {
  const {
    spots_locked,
    total_raised_zar,
    verified_gateway_zar,
    cash_logged_zar,
    rsvp_count,
    has_secret_location_pin,
    ...dbRecord
  } = ev;
  void spots_locked;
  void total_raised_zar;
  void verified_gateway_zar;
  void cash_logged_zar;
  void rsvp_count;
  void has_secret_location_pin;
  if (typeof dbRecord.host_secret_token === "string" && dbRecord.host_secret_token) {
    dbRecord.host_secret_token = sealDbSecret(dbRecord.host_secret_token) ?? dbRecord.host_secret_token;
  }
  if (typeof dbRecord.secret_location_pin === "string" && dbRecord.secret_location_pin) {
    dbRecord.secret_location_pin = sealDbSecret(dbRecord.secret_location_pin) ?? dbRecord.secret_location_pin;
  }
  if (typeof dbRecord.paystack_subaccount_code === "string" && dbRecord.paystack_subaccount_code) {
    dbRecord.paystack_subaccount_code =
      sealDbSecret(dbRecord.paystack_subaccount_code) ?? dbRecord.paystack_subaccount_code;
  }
  return dbRecord;
}

function packFallbackEventDbRecord(ev: Partial<EventItem>): Record<string, unknown> {
  const base = stripEventRollups(ev);
  const {
    host_account_number,
    capitec_payme_url,
    bake_pro_boost_into_price,
    pro_fee_split_mode,
    is_pro_boosted,
    pro_boost_reference,
    is_cancelled,
    is_public,
    previous_event_date,
    allow_cash_on_arrival,
    payout_frozen,
    dispute_count,
    disputed_zar,
    ...legacyCompatible
  } = base;
  void payout_frozen;
  void dispute_count;
  void disputed_zar;
  if (
    legacyCompatible.venue_account_number_last4 !== undefined &&
    legacyCompatible.venue_account_number_last4 !== null &&
    String(legacyCompatible.venue_account_number_last4).length !== 4
  ) {
    legacyCompatible.venue_account_number_last4 = null;
  }
  const realPriceZar =
    typeof ev.price_zar === "number" ? ev.price_zar : undefined;
  const realMinPotZar =
    typeof ev.min_pot_contribution_zar === "number"
      ? ev.min_pot_contribution_zar
      : undefined;
  if (
    (legacyCompatible.mode === "fixed" || legacyCompatible.mode === "pot" || !legacyCompatible.mode) &&
    typeof legacyCompatible.price_zar === "number" &&
    legacyCompatible.price_zar > 0 &&
    legacyCompatible.price_zar < 50
  ) {
    legacyCompatible.price_zar = 50;
  }
  if (
    legacyCompatible.min_pot_contribution_zar !== undefined &&
    legacyCompatible.min_pot_contribution_zar !== null &&
    Number(legacyCompatible.min_pot_contribution_zar) < 50
  ) {
    legacyCompatible.min_pot_contribution_zar = 50;
  }
  const metaPayload = {
    acc: host_account_number ?? null,
    payme: capitec_payme_url ?? null,
    bake: Boolean(bake_pro_boost_into_price),
    splitMode: pro_fee_split_mode ?? (bake_pro_boost_into_price ? "squad_100" : "host_100"),
    pro: Boolean(is_pro_boosted),
    proRef: pro_boost_reference ?? null,
    cancelled: Boolean(is_cancelled),
    pub: Boolean(is_public),
    prevDate: previous_event_date ?? null,
    allowCash: Boolean(allow_cash_on_arrival ?? true),
    frozen: Boolean(payout_frozen),
    disputeCount: Number(dispute_count || 0),
    disputedZar: Number(disputed_zar || 0),
    realPriceZar,
    realMinPotZar,
    sub:
      typeof ev.paystack_subaccount_code === "string" &&
      !ev.paystack_subaccount_code.startsWith("PTMETA:")
        ? ev.paystack_subaccount_code
        : null,
  };
  if (
    host_account_number !== undefined ||
    capitec_payme_url !== undefined ||
    bake_pro_boost_into_price !== undefined ||
    pro_fee_split_mode !== undefined ||
    is_pro_boosted !== undefined ||
    pro_boost_reference !== undefined ||
    is_cancelled !== undefined ||
    is_public !== undefined ||
    previous_event_date !== undefined ||
    allow_cash_on_arrival !== undefined ||
    payout_frozen !== undefined ||
    dispute_count !== undefined ||
    disputed_zar !== undefined ||
    (typeof realPriceZar === "number" && realPriceZar > 0 && realPriceZar < 50) ||
    (typeof realMinPotZar === "number" && realMinPotZar < 50)
  ) {
    legacyCompatible.paystack_subaccount_code = sealDbSecret(
      `PTMETA:${Buffer.from(
        JSON.stringify(metaPayload),
        "utf8"
      ).toString("base64")}`
    );
  }
  return legacyCompatible;
}

function hydrateRemoteEvent(raw: EventItem): EventItem {
  const ev: EventItem = { ...raw };
  if (typeof ev.host_secret_token === "string") {
    ev.host_secret_token = unsealDbSecret(ev.host_secret_token) || ev.host_secret_token;
  }
  if (typeof ev.secret_location_pin === "string") {
    ev.secret_location_pin = unsealDbSecret(ev.secret_location_pin) ?? ev.secret_location_pin;
  }
  if (typeof ev.paystack_subaccount_code === "string") {
    ev.paystack_subaccount_code =
      unsealDbSecret(ev.paystack_subaccount_code) ?? ev.paystack_subaccount_code;
  }
  if (
    typeof ev.paystack_subaccount_code === "string" &&
    ev.paystack_subaccount_code.startsWith("PTMETA:")
  ) {
    try {
      const b64 = ev.paystack_subaccount_code.slice("PTMETA:".length);
      const parsed = JSON.parse(Buffer.from(b64, "base64").toString("utf8"));
      if (ev.host_account_number === undefined || ev.host_account_number === null) {
        ev.host_account_number = parsed.acc ?? null;
      }
      if (ev.capitec_payme_url === undefined || ev.capitec_payme_url === null) {
        ev.capitec_payme_url = parsed.payme ?? null;
      }
      if (ev.bake_pro_boost_into_price === undefined) {
        ev.bake_pro_boost_into_price = Boolean(parsed.bake);
      }
      if (ev.pro_fee_split_mode === undefined) {
        ev.pro_fee_split_mode = parsed.splitMode ?? (parsed.bake ? "squad_100" : "host_100");
      }
      if (ev.is_pro_boosted === undefined) {
        ev.is_pro_boosted = Boolean(parsed.pro);
      }
      if (ev.pro_boost_reference === undefined || ev.pro_boost_reference === null) {
        ev.pro_boost_reference = parsed.proRef ?? null;
      }
      if (ev.is_cancelled === undefined && parsed.cancelled !== undefined) {
        ev.is_cancelled = Boolean(parsed.cancelled);
      }
      if (ev.is_public === undefined && parsed.pub !== undefined) {
        ev.is_public = Boolean(parsed.pub);
      }
      if (
        (ev.previous_event_date === undefined || ev.previous_event_date === null) &&
        parsed.prevDate
      ) {
        ev.previous_event_date = parsed.prevDate;
      }
      if (ev.allow_cash_on_arrival === undefined && parsed.allowCash !== undefined) {
        ev.allow_cash_on_arrival = Boolean(parsed.allowCash);
      }
      if (ev.payout_frozen === undefined && parsed.frozen !== undefined) {
        ev.payout_frozen = Boolean(parsed.frozen);
      }
      if (ev.dispute_count === undefined && parsed.disputeCount !== undefined) {
        ev.dispute_count = Number(parsed.disputeCount) || 0;
      }
      if (ev.disputed_zar === undefined && parsed.disputedZar !== undefined) {
        ev.disputed_zar = Number(parsed.disputedZar) || 0;
      }
      if (typeof parsed.realPriceZar === "number") {
        ev.price_zar = parsed.realPriceZar;
      }
      if (typeof parsed.realMinPotZar === "number") {
        ev.min_pot_contribution_zar = parsed.realMinPotZar;
      }
      ev.paystack_subaccount_code = parsed.sub ?? null;
    } catch {
      // Ignore malformed meta
    }
  }
  // Ensure official seeded demo events in Supabase inherit their Direct PayShap / Capitec PayMe bank fields
  const seedMatch = getInitialSeedData().events.find(
    (s) => s.slug === ev.slug && (ev.id === s.id || String(ev.id || "").startsWith("evt-"))
  );
  if (seedMatch) {
    if (!ev.host_account_number && seedMatch.host_account_number) {
      ev.host_account_number = seedMatch.host_account_number;
    }
    if (!ev.capitec_payme_url && seedMatch.capitec_payme_url) {
      ev.capitec_payme_url = seedMatch.capitec_payme_url;
    }
  } else if (
    ev.host_phone &&
    (ev.host_phone.replace(/\D/g, "") === "27820000000" ||
      ev.host_phone.replace(/\D/g, "") === "0820000000")
  ) {
    ev.host_phone = "";
  }
  return ev;
}

function packFallbackOrderDbRecord(ord: Partial<Order>): Record<string, unknown> {
  const {
    refund_reference,
    refund_reason,
    refunded_at,
    ...legacyCompatible
  } = ord;
  void refund_reference;
  void refund_reason;
  void refunded_at;
  if (legacyCompatible.payment_channel === "payshap") {
    legacyCompatible.payment_channel = "capitec_pay";
  } else if (legacyCompatible.payment_channel === "google_pay") {
    legacyCompatible.payment_channel = "card";
  }
  return legacyCompatible;
}

function packFallbackRsvpDbRecord(rsvp: Partial<GuestRsvp>): Record<string, unknown> {
  const {
    pop_hash,
    pop_rail_badge,
    pop_reference_note,
    guest_whatsapp,
    gate_pin,
    swapped_at,
    refund_status,
    refund_reason,
    refund_reference,
    ...legacyCompatible
  } = rsvp;
  void gate_pin;

  let existingMeta: Record<string, any> = {};
  let cleanCustomAnswer: string | null | undefined = rsvp.custom_answer;
  if (
    typeof rsvp.custom_answer === "string" &&
    rsvp.custom_answer.startsWith("PTPOP:")
  ) {
    try {
      const b64 = rsvp.custom_answer.slice("PTPOP:".length);
      existingMeta = JSON.parse(Buffer.from(b64, "base64").toString("utf8")) || {};
      cleanCustomAnswer = existingMeta.ca ?? null;
    } catch {
      cleanCustomAnswer = null;
    }
  }

  const cleanRefundRef =
    typeof refund_reference === "string" &&
    !refund_reference.startsWith("PTPOP:")
      ? refund_reference
      : existingMeta.r ?? null;

  const origChannel = rsvp.payment_channel;
  const needsChannelMap =
    origChannel === "payshap" || origChannel === "google_pay";
  if (origChannel === "payshap") {
    legacyCompatible.payment_channel = "capitec_pay";
  } else if (origChannel === "google_pay") {
    legacyCompatible.payment_channel = "card";
  }

  if (
    pop_hash ||
    pop_rail_badge ||
    pop_reference_note ||
    guest_whatsapp ||
    cleanRefundRef ||
    refund_status ||
    refund_reason ||
    swapped_at ||
    needsChannelMap ||
    Object.keys(existingMeta).length > 0
  ) {
    const metaPayload = {
      ca: cleanCustomAnswer ?? null,
      h: pop_hash ?? existingMeta.h ?? null,
      b: pop_rail_badge ?? existingMeta.b ?? null,
      n: pop_reference_note ?? existingMeta.n ?? null,
      w: guest_whatsapp ?? existingMeta.w ?? null,
      r: cleanRefundRef,
      rs: refund_status ?? existingMeta.rs ?? null,
      rr: refund_reason ?? existingMeta.rr ?? null,
      sw: swapped_at ?? existingMeta.sw ?? null,
      pc: needsChannelMap ? origChannel : existingMeta.pc ?? null,
    };
    legacyCompatible.custom_answer = sealDbSecret(
      `PTPOP:${Buffer.from(
        JSON.stringify(metaPayload),
        "utf8"
      ).toString("base64")}`
    );
  }
  return legacyCompatible;
}

function hydrateRemoteRsvp(raw: GuestRsvp): GuestRsvp {
  const r: GuestRsvp = { ...raw };
  if (typeof r.custom_answer === "string") {
    r.custom_answer = unsealDbSecret(r.custom_answer) ?? r.custom_answer;
  }
  if (typeof r.refund_reference === "string") {
    r.refund_reference = unsealDbSecret(r.refund_reference) ?? r.refund_reference;
  }
  const applyPtPopMeta = (encoded: string, isFromCustomAnswer: boolean) => {
    try {
      const b64 = encoded.slice("PTPOP:".length);
      const parsed = JSON.parse(Buffer.from(b64, "base64").toString("utf8"));
      if (isFromCustomAnswer) {
        r.custom_answer = parsed.ca ?? null;
      }
      if (!r.pop_hash && parsed.h) r.pop_hash = parsed.h;
      if (!r.pop_rail_badge && parsed.b) r.pop_rail_badge = parsed.b;
      if (!r.pop_reference_note && parsed.n) r.pop_reference_note = parsed.n;
      if (!r.guest_whatsapp && parsed.w) r.guest_whatsapp = parsed.w;
      if (!r.refund_reference && parsed.r) r.refund_reference = parsed.r;
      if (!r.refund_status && parsed.rs) r.refund_status = parsed.rs;
      if (!r.refund_reason && parsed.rr) r.refund_reason = parsed.rr;
      if (!r.swapped_at && parsed.sw) r.swapped_at = parsed.sw;
      if (parsed.pc) r.payment_channel = parsed.pc;
    } catch {
      // Ignore malformed POP meta
    }
  };
  if (
    typeof r.custom_answer === "string" &&
    r.custom_answer.startsWith("PTPOP:")
  ) {
    applyPtPopMeta(r.custom_answer, true);
  }
  if (
    typeof r.refund_reference === "string" &&
    r.refund_reference.startsWith("PTPOP:")
  ) {
    applyPtPopMeta(r.refund_reference, false);
  }
  return r;
}

function slugifyTitle(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 48);
  const suffix = crypto.randomBytes(3).toString("hex");
  return `${base || "pullthru-event"}-${suffix}`;
}

function defaultBadgeForMode(status: RsvpStatus, paymentChannel: PaymentChannel): string {
  if (status === "payday_promise") return "🗓️ Payday Pledge (Standby)";
  if (status === "cash_logged" || paymentChannel === "cash_manual")
    return "💵 Cash Legend";
  if (status === "going_free") return "🏃 Crew Locked In";
  if (paymentChannel === "capitec_pay") return "⚡ Capitec Pay Locked";
  if (paymentChannel === "apple_pay") return "🍏 Apple Pay Locked";
  return "🔥 Spot Locked In";
}

function attachEventRollups(
  events: EventItem[],
  rsvps: GuestRsvp[]
): Array<
  EventItem & {
    spots_locked: number;
    total_raised_zar: number;
    rsvp_count: number;
  }
> {
  return events.map((ev) => {
    const eventRsvps = rsvps.filter((r) => r.event_id === ev.id);
    const confirmed = eventRsvps.filter(
      (r) =>
        r.refund_status !== "refunded" &&
        (r.status === "locked_paid" ||
          r.status === "cash_logged" ||
          r.status === "going_free")
    );
    const spots_locked = confirmed.reduce(
      (sum, r) => sum + (r.spots_locked || 1),
      0
    );
    const total_raised_zar = confirmed.reduce(
      (sum, r) => sum + (r.amount_contributed_zar || 0),
      0
    );
    return {
      ...ev,
      spots_locked,
      total_raised_zar,
      rsvp_count: eventRsvps.length,
    };
  });
}

export async function listEvents(): Promise<
  Array<
    EventItem & {
      spots_locked: number;
      total_raised_zar: number;
      rsvp_count: number;
    }
  >
> {
  const sb = getSupabaseAdminClient();
  if (sb) {
    try {
      const { data, error } = await sb
        .from("events")
        .select("*")
        .order("created_at", { ascending: false });
      if (!error && data && data.length > 0) {
        const { data: rsvpData } = await sb.from("guest_rsvps").select("*");
        return attachEventRollups(
          (data as EventItem[]).map(hydrateRemoteEvent),
          ((rsvpData as GuestRsvp[]) || []).map(hydrateRemoteRsvp)
        );
      }
    } catch {
      // Fall through to local store
    }
  }

  const store = loadLocalStore();
  return attachEventRollups(store.events, store.rsvps);
}

export async function getEventBySlug(
  slug: string
): Promise<{ event: EventItem; rsvps: GuestRsvp[] } | null> {
  const sb = getSupabaseAdminClient();
  if (sb) {
    try {
      const { data: eventData, error: eventErr } = await sb
        .from("events")
        .select("*")
        .eq("slug", slug)
        .single();
      if (!eventErr && eventData) {
        const { data: rsvpData } = await sb
          .from("guest_rsvps")
          .select("*")
          .eq("event_id", eventData.id)
          .order("created_at", { ascending: false });
        return {
          event: hydrateRemoteEvent({ ...(eventData as EventItem) }),
          rsvps: ((rsvpData as GuestRsvp[]) || []).map((r) => hydrateRemoteRsvp({ ...r })),
        };
      }
    } catch {
      // Fall through to local store
    }
  }

  const store = loadLocalStore();
  const event = store.events.find((e) => e.slug === slug);
  if (!event) {
    return null;
  }
  const rsvps = store.rsvps
    .filter((r) => r.event_id === event.id)
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    .map((r) => ({ ...r }));
  return {
    event: {
      ...event,
      tiers: Array.isArray(event.tiers) ? event.tiers.map((t) => ({ ...t })) : [],
      bring_items: Array.isArray(event.bring_items)
        ? event.bring_items.map((b) => ({ ...b }))
        : [],
    },
    rsvps,
  };
}

export async function createEvent(
  input: Partial<EventItem>
): Promise<EventItem> {
  const store = loadLocalStore();
  const now = new Date().toISOString();
  const rawTitle = input.title?.trim() || "PullThru Crew Event";
  const title = rawTitle.slice(0, 140);
  const slug =
    input.slug?.trim() ||
    slugifyTitle(title);

  const newEvent: EventItem = {
    id: input.id || `evt-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`,
    profile_id: input.profile_id || `prof-${Date.now()}-${crypto.randomBytes(2).toString("hex")}`,
    host_name: (input.host_name?.trim() || "PullThru Host").slice(0, 80),
    host_handle:
      input.host_handle?.trim().replace(/^@/, "") ||
      (input.host_name || "host")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "")
        .slice(0, 16) ||
      "host",
    host_phone: input.host_phone !== undefined ? String(input.host_phone).trim() : "",
    host_bank_name:
      input.host_bank_name !== undefined ? input.host_bank_name : null,
    host_account_number:
      input.host_account_number !== undefined ? input.host_account_number : null,
    capitec_payme_url:
      input.capitec_payme_url !== undefined ? input.capitec_payme_url : null,
    bake_pro_boost_into_price:
      input.pro_fee_split_mode === "host_100"
        ? false
        : input.pro_fee_split_mode !== undefined
        ? true
        : Boolean(input.bake_pro_boost_into_price ?? true),
    pro_fee_split_mode:
      input.pro_fee_split_mode ||
      (input.bake_pro_boost_into_price === false ? "host_100" : "squad_100"),
    is_pro_boosted: Boolean(input.is_pro_boosted),
    pro_boost_reference: input.pro_boost_reference ?? null,
    paystack_subaccount_code:
      input.mode === "free"
        ? null
        : input.paystack_subaccount_code !== undefined
        ? input.paystack_subaccount_code
        : null,
    settlement_schedule: input.settlement_schedule || "auto",
    slug,
    mode: input.mode || "fixed",
    category_vibe: input.category_vibe || "🥩 Braai & Potjie",
    title,
    description:
      input.description?.trim() ||
      "Lock your spot in seconds via Direct PayShap, Capitec PayMe, or Instant EFT (R0 Guest Fee). No more flaky WhatsApp drop-outs!",
    price_zar:
      typeof input.price_zar === "number"
        ? input.price_zar
        : input.mode === "free"
        ? 0
        : 100,
    min_pot_contribution_zar:
      input.mode === "pot"
        ? input.min_pot_contribution_zar ?? 50
        : input.min_pot_contribution_zar,
    target_pot_zar:
      input.mode === "pot"
        ? input.target_pot_zar ?? 2500
        : input.target_pot_zar ?? null,
    tiers: Array.isArray(input.tiers) ? input.tiers : [],
    bring_items: Array.isArray(input.bring_items) ? input.bring_items : [],
    custom_question: input.custom_question ?? null,
    hide_amounts_on_wall: Boolean(input.hide_amounts_on_wall),
    allow_payday_promise: Boolean(input.allow_payday_promise),
    allow_cash_on_arrival:
      input.allow_cash_on_arrival !== undefined
        ? Boolean(input.allow_cash_on_arrival)
        : true,
    event_date: input.event_date || "This Saturday • 15:00 SAST",
    location_name: input.location_name || "Sandton, Johannesburg",
    secret_location_pin:
      input.secret_location_pin !== undefined
        ? input.secret_location_pin
        : null,
    max_spots:
      input.max_spots === undefined
        ? input.mode === "pot"
          ? null
          : 15
        : input.max_spots,
    is_active: input.is_active ?? true,
    venue_name: input.venue_name || null,
    venue_deposit_zar: input.venue_deposit_zar || null,
    venue_bank_name: input.venue_bank_name || null,
    venue_account_number_last4:
      input.venue_account_number_last4 &&
      String(input.venue_account_number_last4).replace(/\D/g, "").length === 4
        ? String(input.venue_account_number_last4).replace(/\D/g, "")
        : null,
    host_secret_token:
      input.host_secret_token ||
      `host-secret-${crypto.randomBytes(12).toString("hex")}`,
    created_at: input.created_at || now,
  };

  store.events.unshift(newEvent);
  saveLocalStore(store);

  const sb = getSupabaseAdminClient();
  if (sb) {
    try {
      const { error: profErr } = await sb.from("profiles").upsert(
        {
          id: newEvent.profile_id,
          handle: `${newEvent.host_handle}-${newEvent.profile_id.slice(-4)}`.slice(
            0,
            40
          ),
          display_name:
            newEvent.host_name.length < 2
              ? `${newEvent.host_name} (Host)`
              : newEvent.host_name.slice(0, 80),
          whatsapp_phone: newEvent.host_phone,
          bank_name: newEvent.host_bank_name,
          paystack_subaccount_code: newEvent.paystack_subaccount_code,
          trust_tier: "tier_0_new",
          is_verified: false,
        },
        { onConflict: "id" }
      );
      if (profErr && process.env.NODE_ENV === "production") {
        throw new Error(`Failed to save host profile: ${profErr.message}`);
      }
      let { error: evErr } = await sb.from("events").insert(stripEventRollups(newEvent));
      if (evErr) {
        const retryRes = await sb.from("events").insert(packFallbackEventDbRecord(newEvent));
        evErr = retryRes.error;
      }
      if (evErr && process.env.NODE_ENV === "production") {
        throw new Error(`Failed to save event to database: ${evErr.message}`);
      }
    } catch (err) {
      if (process.env.NODE_ENV === "production") {
        throw err;
      }
      // Local store already persisted in dev/test
    }
  }

  return { ...newEvent };
}

export async function updateEvent(
  slug: string,
  patch: Partial<EventItem>
): Promise<EventItem | null> {
  const store = loadLocalStore();
  let idx = store.events.findIndex((e) => e.slug === slug);

  const sb = getSupabaseAdminClient();
  if (sb) {
    try {
      const { data: remoteEvent } = await sb
        .from("events")
        .select("*")
        .eq("slug", slug)
        .single();
      if (remoteEvent) {
        const hydrated = hydrateRemoteEvent(remoteEvent as EventItem);
        if (idx === -1) {
          store.events.unshift(hydrated);
          idx = 0;
        } else {
          store.events[idx] = { ...store.events[idx], ...hydrated };
        }
      }
    } catch {
      // Continue
    }
  }

  if (idx === -1) {
    return null;
  }

  const updated: EventItem = {
    ...store.events[idx],
    ...patch,
    id: store.events[idx].id,
    slug: patch.slug || store.events[idx].slug,
  };
  store.events[idx] = updated;
  saveLocalStore(store);

  if (sb) {
    try {
      let { error: updErr } = await sb.from("events").update(stripEventRollups(patch)).eq("slug", slug);
      if (
        updErr ||
        patch.paystack_subaccount_code !== undefined ||
        patch.host_account_number !== undefined ||
        patch.capitec_payme_url !== undefined ||
        patch.bake_pro_boost_into_price !== undefined ||
        patch.pro_fee_split_mode !== undefined ||
        patch.is_pro_boosted !== undefined ||
        patch.pro_boost_reference !== undefined ||
        patch.is_cancelled !== undefined ||
        patch.is_public !== undefined ||
        patch.previous_event_date !== undefined ||
        patch.allow_cash_on_arrival !== undefined ||
        (typeof patch.price_zar === "number" && patch.price_zar > 0 && patch.price_zar < 50)
      ) {
        const retryUpd = await sb.from("events").update(packFallbackEventDbRecord(updated)).eq("slug", slug);
        updErr = retryUpd.error;
      }
      if (updErr && process.env.NODE_ENV === "production") {
        throw new Error(`Failed to update event: ${updErr.message}`);
      }
    } catch (err) {
      if (process.env.NODE_ENV === "production") {
        throw err;
      }
      // Local store already updated in dev/test
    }
  }

  return { ...updated };
}

export async function createOrder(
  orderInput: Omit<Order, "id" | "created_at">
): Promise<Order> {
  const store = loadLocalStore();
  const newOrder: Order = {
    ...orderInput,
    buyer_name: orderInput.buyer_name.trim().slice(0, 80),
    id: `ord-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`,
    created_at: new Date().toISOString(),
  };

  store.orders.unshift(newOrder);
  saveLocalStore(store);

  const sb = getSupabaseAdminClient();
  if (sb) {
    try {
      let { error: ordErr } = await sb.from("orders").insert(newOrder);
      if (ordErr) {
        const retryOrd = await sb
          .from("orders")
          .insert(packFallbackOrderDbRecord(newOrder));
        ordErr = retryOrd.error;
      }
      if (ordErr && process.env.NODE_ENV === "production") {
        throw new Error(`Failed to save order to database: ${ordErr.message}`);
      }
    } catch (err) {
      if (process.env.NODE_ENV === "production") {
        throw err;
      }
      // Local store already updated in dev/test
    }
  }

  return { ...newOrder };
}

export async function getOrderByReference(
  reference: string
): Promise<Order | null> {
  const sb = getSupabaseAdminClient();
  if (sb) {
    try {
      const { data, error } = await sb
        .from("orders")
        .select("*")
        .eq("paystack_reference", reference)
        .single();
      if (!error && data) {
        return { ...(data as Order) };
      }
    } catch {
      // Fall through to local store
    }
  }

  const store = loadLocalStore();
  const found = store.orders.find((o) => o.paystack_reference === reference);
  return found ? { ...found } : null;
}

export async function markOrderPaidAndCreateRsvp(
  reference: string,
  rsvpExtras?: {
    comment?: string;
    badge_label?: string;
    claimed_item_id?: string | null;
    custom_answer?: string | null;
    is_anonymous_on_wall?: boolean;
    payment_channel?: PaymentChannel;
    settling_rsvp_id?: string | null;
  }
): Promise<{ order: Order; rsvp: GuestRsvp; event: EventItem } | null> {
  const store = loadLocalStore();
  let orderIdx = store.orders.findIndex(
    (o) => o.paystack_reference === reference
  );

  const sb = getSupabaseAdminClient();
  if (orderIdx === -1 && sb) {
    try {
      const { data: remoteOrder } = await sb
        .from("orders")
        .select("*")
        .eq("paystack_reference", reference)
        .single();
      if (remoteOrder) {
        store.orders.unshift(remoteOrder as Order);
        orderIdx = 0;
      }
    } catch {
      // Continue
    }
  }

  if (orderIdx === -1) {
    return null;
  }

  const order = store.orders[orderIdx];
  let eventIdx = store.events.findIndex((e) => e.id === order.event_id);
  if (eventIdx === -1 && sb) {
    try {
      const { data: remoteEvent } = await sb
        .from("events")
        .select("*")
        .eq("id", order.event_id)
        .single();
      if (remoteEvent) {
        store.events.unshift(remoteEvent as EventItem);
        eventIdx = 0;
      }
    } catch {
      // Continue
    }
  }

  if (eventIdx === -1) {
    return null;
  }
  const event = store.events[eventIdx];

  // Check if RSVP was already created for this order (idempotent webhook/callback handling)
  const existingRsvp = store.rsvps.find((r) => r.order_id === order.id);
  const isAutoSettled = event.settlement_schedule === "auto" && !event.payout_frozen;
  if (existingRsvp) {
    if (
      order.status !== "refunded_partial" &&
      order.status !== "disputed" &&
      existingRsvp.status !== "refunded"
    ) {
      order.status = "paid";
      order.settled_to_host = isAutoSettled;
      saveLocalStore(store);
    }
    return { order: { ...order }, rsvp: { ...existingRsvp }, event: { ...event } };
  }

  const channel = rsvpExtras?.payment_channel || order.payment_channel;
  order.status = "paid";
  order.settled_to_host = isAutoSettled;
  order.payment_channel = channel;
  store.orders[orderIdx] = order;

  const rawGuestDisplayName =
    order.plus_one_names && order.plus_one_names.length > 0
      ? `${order.buyer_name} (+${order.plus_one_names.length}: ${order.plus_one_names.join(", ")})`
      : order.buyer_name;
  const guestDisplayName = rawGuestDisplayName.slice(0, 80);

  // If settling an existing payday_promise RSVP, upgrade it in-place rather than duplicating
  if (rsvpExtras?.settling_rsvp_id) {
    const pledgeIdx = store.rsvps.findIndex(
      (r) =>
        r.id === rsvpExtras.settling_rsvp_id &&
        r.event_id === event.id &&
        r.status === "payday_promise"
    );
    if (pledgeIdx !== -1) {
      const pledge = store.rsvps[pledgeIdx];
      let resolvedClaimedItemId = pledge.claimed_item_id ?? null;
      let claimedItemLabel = pledge.claimed_item_label ?? null;

      if (
        pledge.claimed_item_id &&
        (!rsvpExtras.claimed_item_id ||
          rsvpExtras.claimed_item_id === pledge.claimed_item_id)
      ) {
        const existingItem = event.bring_items.find(
          (b: BringItem) => b.id === pledge.claimed_item_id
        );
        if (existingItem) {
          existingItem.claimed_by_name = order.buyer_name;
          existingItem.claimed_rsvp_id = pledge.id;
          resolvedClaimedItemId = existingItem.id;
          claimedItemLabel = existingItem.label;
        }
      } else if (
        rsvpExtras.claimed_item_id &&
        rsvpExtras.claimed_item_id !== pledge.claimed_item_id
      ) {
        if (pledge.claimed_item_id) {
          const oldItem = event.bring_items.find(
            (b: BringItem) => b.id === pledge.claimed_item_id
          );
          if (oldItem && oldItem.claimed_rsvp_id === pledge.id) {
            oldItem.claimed_by_name = null;
            oldItem.claimed_rsvp_id = null;
          }
        }
        const item = event.bring_items.find(
          (b: BringItem) => b.id === rsvpExtras.claimed_item_id
        );
        if (item && (!item.claimed_by_name || item.claimed_rsvp_id === pledge.id)) {
          item.claimed_by_name = order.buyer_name;
          item.claimed_rsvp_id = pledge.id;
          resolvedClaimedItemId = item.id;
          claimedItemLabel = item.label;
        }
      }

      const resolvedPlusOnes =
        Array.isArray(order.plus_one_names) && order.plus_one_names.length > 0
          ? order.plus_one_names
          : Array.isArray(pledge.plus_one_names)
          ? pledge.plus_one_names
          : [];
      const pledgeDisplayName = (
        resolvedPlusOnes.length > 0
          ? `${order.buyer_name} (+${resolvedPlusOnes.length}: ${resolvedPlusOnes.join(", ")})`
          : order.buyer_name
      ).slice(0, 80);

      const upgradedRsvp: GuestRsvp = {
        ...pledge,
        order_id: order.id,
        guest_name: pledgeDisplayName,
        plus_one_names: resolvedPlusOnes,
        spots_locked: order.spots_count || pledge.spots_locked || 1,
        tier_label: order.tier_label ?? pledge.tier_label ?? null,
        amount_contributed_zar: Number((order.base_price_cents / 100).toFixed(2)),
        status: "locked_paid",
        payment_channel: channel,
        badge_label:
          rsvpExtras.badge_label || "💳 Paid Before Payday (Big Flex)",
        comment: (
          rsvpExtras.comment ??
          pledge.comment ??
          "Payday promise settled & locked in! 🔥"
        ).slice(0, 280),
        claimed_item_id: resolvedClaimedItemId,
        claimed_item_label: claimedItemLabel,
        custom_answer: rsvpExtras.custom_answer ?? pledge.custom_answer ?? null,
        is_anonymous_on_wall:
          rsvpExtras.is_anonymous_on_wall !== undefined
            ? Boolean(rsvpExtras.is_anonymous_on_wall)
            : pledge.is_anonymous_on_wall,
        swap_token: `swap-${crypto.randomBytes(12).toString("hex")}`,
      };

      store.rsvps[pledgeIdx] = upgradedRsvp;
      store.events[eventIdx] = event;
      saveLocalStore(store);

      if (sb) {
        try {
          let { error: ordErr } = await sb
            .from("orders")
            .update({
              status: "paid",
              settled_to_host: isAutoSettled,
              payment_channel: channel,
            })
            .eq("id", order.id);
          if (ordErr) {
            const retryOrd = await sb
              .from("orders")
              .update(
                packFallbackOrderDbRecord({
                  status: "paid",
                  settled_to_host: isAutoSettled,
                  payment_channel: channel,
                })
              )
              .eq("id", order.id);
            ordErr = retryOrd.error;
          }
          if (ordErr && process.env.NODE_ENV === "production") {
            throw new Error(`Failed to update order status: ${ordErr.message}`);
          }
          const {
            id: _rsvpId,
            event_id: _evtId,
            created_at: _createdAt,
            ...mutableRsvpFields
          } = upgradedRsvp;
          void _rsvpId;
          void _evtId;
          void _createdAt;
          let { error: rsvpErr } = await sb
            .from("guest_rsvps")
            .update(mutableRsvpFields)
            .eq("id", upgradedRsvp.id);
          if (rsvpErr) {
            const retryRsvp = await sb
              .from("guest_rsvps")
              .update(packFallbackRsvpDbRecord(mutableRsvpFields))
              .eq("id", upgradedRsvp.id);
            rsvpErr = retryRsvp.error;
          }
          if (rsvpErr && process.env.NODE_ENV === "production") {
            throw new Error(`Failed to update upgraded RSVP: ${rsvpErr.message}`);
          }
          await sb
            .from("events")
            .update({ bring_items: event.bring_items })
            .eq("id", event.id);
        } catch (err) {
          if (process.env.NODE_ENV === "production") {
            throw err;
          }
          // Local store already persisted in dev/test
        }
      }

      return { order: { ...order }, rsvp: { ...upgradedRsvp }, event: { ...event } };
    }
  }

  const rsvpId = `rsvp-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`;
  let resolvedClaimedItemId: string | null = null;
  let claimedItemLabel: string | null = null;

  if (rsvpExtras?.claimed_item_id) {
    const item = event.bring_items.find(
      (b: BringItem) => b.id === rsvpExtras.claimed_item_id
    );
    if (item && !item.claimed_by_name) {
      item.claimed_by_name = order.buyer_name;
      item.claimed_rsvp_id = rsvpId;
      resolvedClaimedItemId = item.id;
      claimedItemLabel = item.label;
    }
  }

  const newRsvp: GuestRsvp = {
    id: rsvpId,
    order_id: order.id,
    event_id: event.id,
    guest_name: guestDisplayName,
    plus_one_names: order.plus_one_names || [],
    spots_locked: order.spots_count || 1,
    tier_label: order.tier_label ?? null,
    amount_contributed_zar: Number((order.base_price_cents / 100).toFixed(2)),
    status: "locked_paid",
    payment_channel: channel,
    badge_label:
      rsvpExtras?.badge_label || defaultBadgeForMode("locked_paid", channel),
    comment: (rsvpExtras?.comment ?? "Spot locked in! Pulling through 🔥").slice(0, 280),
    claimed_item_id: resolvedClaimedItemId,
    claimed_item_label: claimedItemLabel,
    custom_answer: rsvpExtras?.custom_answer ?? null,
    is_anonymous_on_wall: Boolean(rsvpExtras?.is_anonymous_on_wall),
    checked_in: false,
    swap_token: `swap-${crypto.randomBytes(12).toString("hex")}`,
    created_at: new Date().toISOString(),
  };

  store.rsvps.unshift(newRsvp);
  store.events[eventIdx] = event;
  saveLocalStore(store);

  if (sb) {
    try {
      let { error: ordErr } = await sb
        .from("orders")
        .update({
          status: "paid",
          settled_to_host: isAutoSettled,
          payment_channel: channel,
        })
        .eq("id", order.id);
      if (ordErr) {
        const retryOrd = await sb
          .from("orders")
          .update(
            packFallbackOrderDbRecord({
              status: "paid",
              settled_to_host: isAutoSettled,
              payment_channel: channel,
            })
          )
          .eq("id", order.id);
        ordErr = retryOrd.error;
      }
      if (ordErr && process.env.NODE_ENV === "production") {
        throw new Error(`Failed to update order status: ${ordErr.message}`);
      }
      let { error: rsvpErr } = await sb.from("guest_rsvps").insert(newRsvp);
      if (rsvpErr) {
        const retryRsvp = await sb
          .from("guest_rsvps")
          .insert(packFallbackRsvpDbRecord(newRsvp));
        rsvpErr = retryRsvp.error;
      }
      if (rsvpErr && process.env.NODE_ENV === "production") {
        throw new Error(`Failed to insert paid RSVP: ${rsvpErr.message}`);
      }
      await sb
        .from("events")
        .update({ bring_items: event.bring_items })
        .eq("id", event.id);
    } catch (err) {
      if (process.env.NODE_ENV === "production") {
        throw err;
      }
      // Local store already persisted in dev/test
    }
  }

  return { order: { ...order }, rsvp: { ...newRsvp }, event: { ...event } };
}

export async function createDirectRsvp(
  input: Omit<GuestRsvp, "id" | "created_at" | "swap_token" | "checked_in"> & {
    settling_rsvp_id?: string | null;
  }
): Promise<{ rsvp: GuestRsvp; event: EventItem }> {
  const store = loadLocalStore();
  let eventIdx = store.events.findIndex((e) => e.id === input.event_id);

  const sb = getSupabaseAdminClient();
  if (eventIdx === -1 && sb) {
    try {
      const { data: remoteEvent } = await sb
        .from("events")
        .select("*")
        .eq("id", input.event_id)
        .single();
      if (remoteEvent) {
        store.events.unshift(hydrateRemoteEvent(remoteEvent as EventItem));
        eventIdx = 0;
      }
    } catch {
      // Continue
    }
  }

  if (eventIdx === -1) {
    throw new Error(`Event not found: ${input.event_id}`);
  }

  const event = store.events[eventIdx];
  const { settling_rsvp_id, ...cleanInput } = input;

  // If settling an existing payday_promise RSVP via Direct PayShap / POP, upgrade it in-place rather than duplicating
  if (settling_rsvp_id) {
    let pledgeIdx = store.rsvps.findIndex(
      (r) =>
        r.id === settling_rsvp_id &&
        r.event_id === event.id &&
        r.status === "payday_promise"
    );
    if (pledgeIdx === -1 && sb) {
      try {
        const { data: remotePledge } = await sb
          .from("guest_rsvps")
          .select("*")
          .eq("id", settling_rsvp_id)
          .eq("event_id", event.id)
          .single();
        if (remotePledge && remotePledge.status === "payday_promise") {
          store.rsvps.unshift(hydrateRemoteRsvp(remotePledge as GuestRsvp));
          pledgeIdx = 0;
        }
      } catch {
        // Ignore
      }
    }

    if (pledgeIdx !== -1) {
      const pledge = store.rsvps[pledgeIdx];
      let resolvedClaimedItemId = pledge.claimed_item_id ?? null;
      let claimedItemLabel = pledge.claimed_item_label ?? null;

      if (cleanInput.claimed_item_id) {
        if (
          pledge.claimed_item_id &&
          pledge.claimed_item_id !== cleanInput.claimed_item_id
        ) {
          const oldItem = event.bring_items.find(
            (b: BringItem) => b.id === pledge.claimed_item_id
          );
          if (oldItem && oldItem.claimed_rsvp_id === pledge.id) {
            oldItem.claimed_by_name = null;
            oldItem.claimed_rsvp_id = null;
          }
        }
        const item = event.bring_items.find(
          (b: BringItem) => b.id === cleanInput.claimed_item_id
        );
        if (item && (!item.claimed_by_name || item.claimed_rsvp_id === pledge.id)) {
          item.claimed_by_name = cleanInput.guest_name.slice(0, 80);
          item.claimed_rsvp_id = pledge.id;
          resolvedClaimedItemId = item.id;
          claimedItemLabel = item.label;
        }
      }

      const upgradedRsvp: GuestRsvp = {
        ...pledge,
        ...cleanInput,
        id: pledge.id,
        guest_name: cleanInput.guest_name.trim().slice(0, 80),
        comment: cleanInput.comment ? cleanInput.comment.trim().slice(0, 280) : pledge.comment,
        claimed_item_id: resolvedClaimedItemId,
        claimed_item_label: claimedItemLabel,
        swap_token: `swap-${crypto.randomBytes(12).toString("hex")}`,
      };

      store.rsvps[pledgeIdx] = upgradedRsvp;
      store.events[eventIdx] = event;
      saveLocalStore(store);

      if (sb) {
        try {
          const {
            id: _id,
            event_id: _eid,
            created_at: _cat,
            ...mutableFields
          } = upgradedRsvp;
          void _id;
          void _eid;
          void _cat;
          let { error: rsvpErr } = await sb
            .from("guest_rsvps")
            .update(mutableFields)
            .eq("id", upgradedRsvp.id);
          if (rsvpErr) {
            const retryRes = await sb
              .from("guest_rsvps")
              .update(packFallbackRsvpDbRecord(mutableFields))
              .eq("id", upgradedRsvp.id);
            rsvpErr = retryRes.error;
          }
          if (rsvpErr && process.env.NODE_ENV === "production") {
            throw new Error(`Failed to update settled RSVP: ${rsvpErr.message}`);
          }
          if (resolvedClaimedItemId) {
            await sb
              .from("events")
              .update({ bring_items: event.bring_items })
              .eq("id", event.id);
          }
        } catch (err) {
          if (process.env.NODE_ENV === "production") {
            throw err;
          }
        }
      }

      return { rsvp: { ...upgradedRsvp }, event: { ...event } };
    }
  }

  // Synchronous atomic capacity guard right before inserting into store.rsvps
  // Prevents concurrent async requests from overbooking max_spots
  if (cleanInput.status !== "payday_promise") {
    const requestedSpots = Math.max(1, Number(cleanInput.spots_locked) || 1);
    const activeEventRsvps = store.rsvps.filter(
      (r) =>
        r.event_id === event.id &&
        (r.status === "locked_paid" ||
          r.status === "cash_logged" ||
          r.status === "going_free") &&
        r.refund_status !== "refunded"
    );
    if (event.max_spots !== null && event.max_spots > 0) {
      const currentLockedSpots = activeEventRsvps.reduce(
        (sum, r) => sum + (Number(r.spots_locked) || 1),
        0
      );
      if (currentLockedSpots + requestedSpots > event.max_spots) {
        const remaining = Math.max(0, event.max_spots - currentLockedSpots);
        throw new Error(
          remaining === 0
            ? "CAPACITY_EXCEEDED: Eish! This event is officially FULL (0 spots remaining)."
            : `CAPACITY_EXCEEDED: Only ${remaining} spot(s) left, cannot lock ${requestedSpots} spots.`
        );
      }
    }
    if (
      cleanInput.tier_label &&
      Array.isArray(event.tiers) &&
      event.tiers.length > 0
    ) {
      const matchedTier = event.tiers.find(
        (t) =>
          t.label.trim().toLowerCase() ===
          cleanInput.tier_label!.trim().toLowerCase()
      );
      const tierMaxSpots = matchedTier?.max_spots ?? null;
      if (matchedTier && tierMaxSpots !== null && tierMaxSpots > 0) {
        const currentTierLocked = activeEventRsvps
          .filter(
            (r) =>
              r.tier_label?.trim().toLowerCase() ===
              matchedTier.label.trim().toLowerCase()
          )
          .reduce((sum, r) => sum + (Number(r.spots_locked) || 1), 0);
        if (currentTierLocked + requestedSpots > tierMaxSpots) {
          const tierRemaining = Math.max(0, tierMaxSpots - currentTierLocked);
          throw new Error(
            tierRemaining === 0
              ? `CAPACITY_EXCEEDED: The "${matchedTier.label}" tier is officially SOLD OUT!`
              : `CAPACITY_EXCEEDED: Only ${tierRemaining} spot(s) left in "${matchedTier.label}".`
          );
        }
      }
    }
  }

  const rsvpId = `rsvp-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`;
  let resolvedClaimedItemId: string | null = null;
  let claimedItemLabel: string | null = null;

  if (cleanInput.claimed_item_id && cleanInput.status !== "payday_promise") {
    const item = event.bring_items.find(
      (b: BringItem) => b.id === cleanInput.claimed_item_id
    );
    if (item && !item.claimed_by_name) {
      item.claimed_by_name = cleanInput.guest_name.slice(0, 80);
      item.claimed_rsvp_id = rsvpId;
      resolvedClaimedItemId = item.id;
      claimedItemLabel = item.label;
    }
  }

  const newRsvp: GuestRsvp = {
    ...cleanInput,
    id: rsvpId,
    guest_name: cleanInput.guest_name.trim().slice(0, 80),
    comment: cleanInput.comment ? cleanInput.comment.trim().slice(0, 280) : null,
    claimed_item_id: resolvedClaimedItemId,
    claimed_item_label: claimedItemLabel,
    badge_label:
      cleanInput.badge_label ||
      defaultBadgeForMode(cleanInput.status, cleanInput.payment_channel),
    checked_in: false,
    swap_token: `swap-${crypto.randomBytes(12).toString("hex")}`,
    created_at: new Date().toISOString(),
  };

  store.rsvps.unshift(newRsvp);
  store.events[eventIdx] = event;
  saveLocalStore(store);

  if (sb) {
    try {
      let { error: rsvpErr } = await sb.from("guest_rsvps").insert(newRsvp);
      if (rsvpErr) {
        const retryRes = await sb
          .from("guest_rsvps")
          .insert(packFallbackRsvpDbRecord(newRsvp));
        rsvpErr = retryRes.error;
      }
      if (rsvpErr && process.env.NODE_ENV === "production") {
        throw new Error(`Failed to persist RSVP to database: ${rsvpErr.message}`);
      }
      if (resolvedClaimedItemId) {
        await sb
          .from("events")
          .update({ bring_items: event.bring_items })
          .eq("id", event.id);
      }
    } catch (err) {
      if (process.env.NODE_ENV === "production") {
        throw err;
      }
      // Local store already persisted in dev/test
    }
  }

  return { rsvp: { ...newRsvp }, event: { ...event } };
}

export async function isPopHashAlreadyUsed(popHashes: string[]): Promise<boolean> {
  const validHashes = popHashes.map((h) => h.trim()).filter((h) => h.length >= 8);
  if (validHashes.length === 0) return false;
  const hashSet = new Set(validHashes);

  const store = loadLocalStore();
  const inMemMatch = store.rsvps.some(
    (r) =>
      r.status !== "refunded" &&
      r.refund_status !== "refunded" &&
      r.pop_hash &&
      hashSet.has(r.pop_hash)
  );
  if (inMemMatch) return true;

  const sb = getSupabaseAdminClient();
  if (sb) {
    try {
      const { data: remoteRsvps } = await sb.from("guest_rsvps").select("*");
      if (Array.isArray(remoteRsvps)) {
        const remoteMatch = (remoteRsvps as GuestRsvp[])
          .map(hydrateRemoteRsvp)
          .some(
            (r) =>
              r.status !== "refunded" &&
              r.refund_status !== "refunded" &&
              r.pop_hash &&
              hashSet.has(r.pop_hash)
          );
        if (remoteMatch) return true;
      }
    } catch {
      // Ignore
    }
  }
  return false;
}

export async function swapRsvpSpot(params: {
  slug: string;
  swapToken: string;
  newGuestName: string;
  newGuestWhatsapp?: string | null;
  newComment?: string;
  newBadgeLabel?: string;
  unclaimItem?: boolean;
  newPlusOneNames?: string[];
}): Promise<GuestRsvp | null> {
  const store = loadLocalStore();
  let eventIdx = store.events.findIndex((e) => e.slug === params.slug);

  const sb = getSupabaseAdminClient();
  if (eventIdx === -1 && sb) {
    try {
      const { data: remoteEvent } = await sb
        .from("events")
        .select("*")
        .eq("slug", params.slug)
        .single();
      if (remoteEvent) {
        store.events.unshift(hydrateRemoteEvent(remoteEvent as EventItem));
        eventIdx = 0;
      }
    } catch {
      // Continue
    }
  }

  if (eventIdx === -1) {
    return null;
  }
  const event = store.events[eventIdx];

  const cleanToken = (params.swapToken || "").trim();
  if (!cleanToken) {
    return null;
  }

  // Strict cryptographic swap_token match only (never allow public rsvp.id hijack)
  let rsvpIdx = store.rsvps.findIndex(
    (r) => r.event_id === event.id && r.swap_token === cleanToken
  );
  if (rsvpIdx === -1 && sb) {
    try {
      const { data: remoteRsvp } = await sb
        .from("guest_rsvps")
        .select("*")
        .eq("event_id", event.id)
        .eq("swap_token", cleanToken)
        .single();
      if (remoteRsvp) {
        store.rsvps.unshift(hydrateRemoteRsvp(remoteRsvp as GuestRsvp));
        rsvpIdx = 0;
      }
    } catch {
      // Continue
    }
  }

  if (rsvpIdx === -1) {
    return null;
  }

  const existing = store.rsvps[rsvpIdx];
  // Block unpaid Payday 25th Standby pledges and refunded/disputed spots from being swapped/sold
  if (
    existing.status === "payday_promise" ||
    existing.status === "refunded" ||
    existing.refund_status === "refunded" ||
    existing.refund_status === "disputed"
  ) {
    return null;
  }

  const previousName = existing.is_anonymous_on_wall
    ? "an Anonymous Legend"
    : existing.guest_name.replace(/\s*\(🔄 Swapped from .*\)$/i, "");
  const trimmedNewName = params.newGuestName.trim().slice(0, 80);

  const auditSuffix = `(🔄 Swapped from ${previousName})`;
  const rawResolvedComment = params.newComment?.trim()
    ? params.newComment.trim().includes("Swapped from")
      ? params.newComment.trim()
      : `${params.newComment.trim()} ${auditSuffix}`
    : `🔄 Took over ${previousName}'s locked spot! ${auditSuffix}`;
  const resolvedComment = rawResolvedComment.slice(0, 280);

  // Rotate swap_token on transfer so the previous guest cannot re-hijack the transferred spot
  const rotatedSwapToken = `swap-${crypto.randomBytes(12).toString("hex")}`;

  const resolvedPlusOnes = Array.isArray(params.newPlusOneNames)
    ? params.newPlusOneNames.slice(0, 20).map((n) => String(n).trim().slice(0, 60)).filter(Boolean)
    : [];

  const cleanNewWhatsapp = params.newGuestWhatsapp
    ? String(params.newGuestWhatsapp).trim().slice(0, 30)
    : null;

  const updatedRsvp: GuestRsvp = {
    ...existing,
    guest_name: trimmedNewName,
    guest_whatsapp: cleanNewWhatsapp,
    plus_one_names: resolvedPlusOnes,
    comment: resolvedComment,
    badge_label:
      params.newBadgeLabel?.trim().slice(0, 80) || "🔄 Spot Swapped & Locked",
    swap_token: rotatedSwapToken,
    gate_pin: deriveGatePin(rotatedSwapToken),
    swapped_at: new Date().toISOString(),
  };

  let bringItemsMutated = false;
  if (existing.claimed_item_id) {
    const item = event.bring_items.find(
      (b) => b.id === existing.claimed_item_id
    );
    if (params.unclaimItem) {
      if (item) {
        item.claimed_by_name = null;
        item.claimed_rsvp_id = null;
        bringItemsMutated = true;
      }
      updatedRsvp.claimed_item_id = null;
      updatedRsvp.claimed_item_label = null;
    } else if (item) {
      item.claimed_by_name = trimmedNewName;
      bringItemsMutated = true;
    }
  }

  store.rsvps[rsvpIdx] = updatedRsvp;
  store.events[eventIdx] = event;
  saveLocalStore(store);

  if (sb) {
    try {
      const swapPatch: Partial<GuestRsvp> = {
        guest_name: updatedRsvp.guest_name,
        guest_whatsapp: updatedRsvp.guest_whatsapp,
        plus_one_names: updatedRsvp.plus_one_names,
        comment: updatedRsvp.comment,
        badge_label: updatedRsvp.badge_label,
        claimed_item_id: updatedRsvp.claimed_item_id,
        claimed_item_label: updatedRsvp.claimed_item_label,
        swap_token: updatedRsvp.swap_token,
        swapped_at: updatedRsvp.swapped_at,
      };
      let { error: rsvpErr } = await sb
        .from("guest_rsvps")
        .update(swapPatch)
        .eq("id", existing.id);
      if (rsvpErr) {
        const retryRes = await sb
          .from("guest_rsvps")
          .update(
            packFallbackRsvpDbRecord({
              ...swapPatch,
              custom_answer: updatedRsvp.custom_answer,
              payment_channel: updatedRsvp.payment_channel,
              pop_hash: updatedRsvp.pop_hash,
              pop_rail_badge: updatedRsvp.pop_rail_badge,
              pop_reference_note: updatedRsvp.pop_reference_note,
              refund_reference: updatedRsvp.refund_reference,
              refund_status: updatedRsvp.refund_status,
              refund_reason: updatedRsvp.refund_reason,
            })
          )
          .eq("id", existing.id);
        rsvpErr = retryRes.error;
      }
      if (rsvpErr && process.env.NODE_ENV === "production") {
        throw new Error(`Failed to update swapped RSVP in database: ${rsvpErr.message}`);
      }
      if (bringItemsMutated) {
        await sb
          .from("events")
          .update({ bring_items: event.bring_items })
          .eq("id", event.id);
      }
    } catch (err) {
      if (process.env.NODE_ENV === "production") {
        throw err;
      }
      // Local store already persisted in dev/test
    }
  }

  return { ...updatedRsvp };
}

export async function toggleCheckInRsvp(
  slug: string,
  rsvpId: string
): Promise<GuestRsvp | null> {
  const store = loadLocalStore();
  let event = store.events.find((e) => e.slug === slug);

  const sb = getSupabaseAdminClient();
  if (!event && sb) {
    try {
      const { data: remoteEvent } = await sb
        .from("events")
        .select("*")
        .eq("slug", slug)
        .single();
      if (remoteEvent) {
        const hydrated = hydrateRemoteEvent(remoteEvent as EventItem);
        store.events.unshift(hydrated);
        event = hydrated;
      }
    } catch {
      // Continue
    }
  }

  if (!event) {
    return null;
  }

  let rsvpIdx = store.rsvps.findIndex(
    (r) => r.event_id === event.id && r.id === rsvpId
  );
  if (rsvpIdx === -1 && sb) {
    try {
      const { data: remoteRsvp } = await sb
        .from("guest_rsvps")
        .select("*")
        .eq("event_id", event.id)
        .eq("id", rsvpId)
        .single();
      if (remoteRsvp) {
        store.rsvps.unshift(hydrateRemoteRsvp(remoteRsvp as GuestRsvp));
        rsvpIdx = 0;
      }
    } catch {
      // Continue
    }
  }

  if (rsvpIdx === -1) {
    return null;
  }

  store.rsvps[rsvpIdx] = {
    ...store.rsvps[rsvpIdx],
    checked_in: !store.rsvps[rsvpIdx].checked_in,
  };
  saveLocalStore(store);

  if (sb) {
    try {
      const { error: rsvpErr } = await sb
        .from("guest_rsvps")
        .update({ checked_in: store.rsvps[rsvpIdx].checked_in })
        .eq("id", rsvpId);
      if (rsvpErr && process.env.NODE_ENV === "production") {
        throw new Error(`Failed to update check-in status: ${rsvpErr.message}`);
      }
    } catch (err) {
      if (process.env.NODE_ENV === "production") {
        throw err;
      }
      // Local store already persisted in dev/test
    }
  }

  return { ...store.rsvps[rsvpIdx] };
}

export async function unclaimBringItem(
  slug: string,
  itemId: string
): Promise<{ event: EventItem; item: BringItem } | null> {
  const store = loadLocalStore();
  let eventIdx = store.events.findIndex((e) => e.slug === slug);
  const sb = getSupabaseAdminClient();
  if (eventIdx === -1 && sb) {
    try {
      const { data: remoteEvent } = await sb
        .from("events")
        .select("*")
        .eq("slug", slug)
        .single();
      if (remoteEvent) {
        store.events.unshift(hydrateRemoteEvent(remoteEvent as EventItem));
        eventIdx = 0;
      }
    } catch {
      // Continue
    }
  }
  if (eventIdx === -1) return null;

  const event = store.events[eventIdx];
  const item = (event.bring_items || []).find((b) => b.id === itemId);
  if (!item) return null;

  const prevRsvpId = item.claimed_rsvp_id;
  item.claimed_by_name = null;
  item.claimed_rsvp_id = null;

  if (prevRsvpId) {
    const rsvpIdx = store.rsvps.findIndex(
      (r) => r.event_id === event.id && r.id === prevRsvpId
    );
    if (rsvpIdx !== -1) {
      store.rsvps[rsvpIdx] = {
        ...store.rsvps[rsvpIdx],
        claimed_item_id: null,
        claimed_item_label: null,
      };
    }
    if (sb) {
      try {
        await sb
          .from("guest_rsvps")
          .update({ claimed_item_id: null, claimed_item_label: null })
          .eq("id", prevRsvpId);
      } catch {
        // Ignore
      }
    }
  }

  store.events[eventIdx] = event;
  saveLocalStore(store);
  if (sb) {
    try {
      await sb
        .from("events")
        .update({ bring_items: event.bring_items })
        .eq("id", event.id);
    } catch {
      // Ignore
    }
  }
  return { event: { ...event }, item: { ...item } };
}

export async function moderateRsvp(
  slug: string,
  rsvpId: string,
  moderationAction: "hide_comment" | "remove_unpaid" | "verify_pop" | "verify_cash"
): Promise<{ rsvp?: GuestRsvp; removedId?: string; event?: EventItem } | null> {
  const store = loadLocalStore();
  let event = store.events.find((e) => e.slug === slug);
  const sb = getSupabaseAdminClient();
  if (!event && sb) {
    try {
      const { data: remoteEvent } = await sb
        .from("events")
        .select("*")
        .eq("slug", slug)
        .single();
      if (remoteEvent) {
        const hydrated = hydrateRemoteEvent(remoteEvent as EventItem);
        store.events.unshift(hydrated);
        event = hydrated;
      }
    } catch {
      // Continue
    }
  }
  if (!event) return null;
  const resolvedEventId = event.id;

  let rsvpIdx = store.rsvps.findIndex(
    (r) => r.event_id === resolvedEventId && r.id === rsvpId
  );
  if (rsvpIdx === -1 && sb) {
    try {
      const { data: remoteRsvp } = await sb
        .from("guest_rsvps")
        .select("*")
        .eq("event_id", event.id)
        .eq("id", rsvpId)
        .single();
      if (remoteRsvp) {
        store.rsvps.unshift(hydrateRemoteRsvp(remoteRsvp as GuestRsvp));
        rsvpIdx = 0;
      }
    } catch {
      // Continue
    }
  }
  if (rsvpIdx === -1) return null;

  const target = store.rsvps[rsvpIdx];

  if (moderationAction === "verify_pop") {
    store.rsvps[rsvpIdx] = {
      ...target,
      status: "locked_paid",
      pop_rail_badge: "instant_payshap",
    };
    saveLocalStore(store);
    if (sb) {
      try {
        const { error: vErr } = await sb
          .from("guest_rsvps")
          .update({ status: "locked_paid", pop_rail_badge: "instant_payshap" })
          .eq("id", target.id);
        if (vErr) {
          await sb
            .from("guest_rsvps")
            .update(
              packFallbackRsvpDbRecord({
                status: "locked_paid",
                custom_answer: target.custom_answer,
                payment_channel: target.payment_channel,
                pop_hash: target.pop_hash,
                pop_rail_badge: "instant_payshap",
                pop_reference_note: target.pop_reference_note,
                guest_whatsapp: target.guest_whatsapp,
                swapped_at: target.swapped_at,
                refund_reference: target.refund_reference,
                refund_status: target.refund_status,
                refund_reason: target.refund_reason,
              })
            )
            .eq("id", target.id);
        }
      } catch {
        // Ignore
      }
    }
    const rolledUp = attachEventRollups([event], store.rsvps)[0];
    return { rsvp: { ...store.rsvps[rsvpIdx] }, event: rolledUp };
  }

  if (moderationAction === "verify_cash") {
    const isPayShapRsvp =
      target.badge_label === "📲 PayShap Sent" ||
      target.payment_channel === "payshap" ||
      Boolean(target.pop_reference_note?.includes("PayShap"));
    const verifiedNote = isPayShapRsvp
      ? "✅ PayShap Received & Verified by Host"
      : "💵 Cash Received & Verified by Host";
    store.rsvps[rsvpIdx] = {
      ...target,
      status: "cash_logged",
      pop_reference_note: verifiedNote,
      checked_in: true,
    };
    saveLocalStore(store);
    if (sb) {
      try {
        const { error: cErr } = await sb
          .from("guest_rsvps")
          .update({
            status: "cash_logged",
            pop_reference_note: verifiedNote,
            checked_in: true,
          })
          .eq("id", target.id);
        if (cErr) {
          await sb
            .from("guest_rsvps")
            .update(
              packFallbackRsvpDbRecord({
                status: "cash_logged",
                custom_answer: target.custom_answer,
                payment_channel: target.payment_channel,
                pop_hash: target.pop_hash,
                pop_rail_badge: target.pop_rail_badge,
                pop_reference_note: verifiedNote,
                checked_in: true,
                guest_whatsapp: target.guest_whatsapp,
                swapped_at: target.swapped_at,
                refund_reference: target.refund_reference,
                refund_status: target.refund_status,
                refund_reason: target.refund_reason,
              })
            )
            .eq("id", target.id);
        }
      } catch {
        // Ignore
      }
    }
    const rolledUp = attachEventRollups([event], store.rsvps)[0];
    return { rsvp: { ...store.rsvps[rsvpIdx] }, event: rolledUp };
  }

  if (moderationAction === "hide_comment") {
    store.rsvps[rsvpIdx] = {
      ...target,
      comment: "🛡️ [Comment hidden by Host]",
    };
    saveLocalStore(store);
    if (sb) {
      try {
        await sb
          .from("guest_rsvps")
          .update({ comment: "🛡️ [Comment hidden by Host]" })
          .eq("id", target.id);
      } catch {
        // Ignore
      }
    }
    const rolledUp = attachEventRollups([event], store.rsvps)[0];
    return { rsvp: { ...store.rsvps[rsvpIdx] }, event: rolledUp };
  }

  // remove_unpaid: permitted on unpaid/free/cash entries AND Direct P2P POP entries where host verifies bank receipt
  // (never delete legacy gateway order_id spots without refund)
  if (target.status === "locked_paid" && target.order_id && !target.pop_hash) {
    return null;
  }

  const evtIdx = store.events.findIndex((e) => e.id === resolvedEventId);
  if (target.claimed_item_id && evtIdx !== -1) {
    const item = (store.events[evtIdx].bring_items || []).find(
      (b) => b.id === target.claimed_item_id
    );
    if (item && item.claimed_rsvp_id === target.id) {
      item.claimed_by_name = null;
      item.claimed_rsvp_id = null;
      event = store.events[evtIdx];
      if (sb) {
        try {
          await sb
            .from("events")
            .update({ bring_items: store.events[evtIdx].bring_items })
            .eq("id", event.id);
        } catch {
          // Ignore
        }
      }
    }
  }

  store.rsvps.splice(rsvpIdx, 1);
  saveLocalStore(store);
  if (sb) {
    try {
      await sb.from("guest_rsvps").delete().eq("id", rsvpId);
    } catch {
      // Ignore
    }
  }
  const rolledUp = attachEventRollups([event], store.rsvps)[0];
  return { removedId: rsvpId, event: rolledUp };
}

export async function expirePaydayPledges(
  slug: string
): Promise<{ event: EventItem; expiredCount: number } | null> {
  const store = loadLocalStore();
  let eventIdx = store.events.findIndex((e) => e.slug === slug);
  const sb = getSupabaseAdminClient();
  if (eventIdx === -1 && sb) {
    try {
      const { data: remoteEvent } = await sb
        .from("events")
        .select("*")
        .eq("slug", slug)
        .single();
      if (remoteEvent) {
        store.events.unshift(hydrateRemoteEvent(remoteEvent as EventItem));
        eventIdx = 0;
      }
    } catch {
      // Continue
    }
  }
  if (eventIdx === -1) return null;

  const event = store.events[eventIdx];
  const beforeCount = store.rsvps.length;
  store.rsvps = store.rsvps.filter(
    (r) => !(r.event_id === event.id && r.status === "payday_promise")
  );
  let expiredCount = beforeCount - store.rsvps.length;
  saveLocalStore(store);

  if (sb) {
    try {
      const { data: remotePledges } = await sb
        .from("guest_rsvps")
        .select("id")
        .eq("event_id", event.id)
        .eq("status", "payday_promise");
      if (Array.isArray(remotePledges) && remotePledges.length > 0) {
        expiredCount = Math.max(expiredCount, remotePledges.length);
        await sb
          .from("guest_rsvps")
          .delete()
          .eq("event_id", event.id)
          .eq("status", "payday_promise");
      }
    } catch {
      // Ignore
    }
  }

  const rolledUp = attachEventRollups([event], store.rsvps)[0];
  return { event: rolledUp, expiredCount };
}

export async function recoverHostToken(params: {
  slug: string;
  hostPhone: string;
  secretCheck: string;
}): Promise<{
  host_secret_token: string;
  slug: string;
  title: string;
} | null> {
  const store = loadLocalStore();
  let event = store.events.find((e) => e.slug === params.slug);
  const sb = getSupabaseAdminClient();
  if (!event && sb) {
    try {
      const { data: remoteEvent } = await sb
        .from("events")
        .select("*")
        .eq("slug", params.slug)
        .single();
      if (remoteEvent) {
        const hydrated = hydrateRemoteEvent(remoteEvent as EventItem);
        store.events.unshift(hydrated);
        event = hydrated;
      }
    } catch {
      // Continue
    }
  }
  if (!event || !event.host_secret_token) return null;

  // Never allow recovering hardcoded demo seed host tokens in production
  if (
    process.env.NODE_ENV === "production" &&
    event.host_secret_token.startsWith("host-secret-") &&
    !/[0-9a-f]{12}/i.test(event.host_secret_token)
  ) {
    return null;
  }

  const inputPhone = (params.hostPhone || "").replace(/\D/g, "");
  const eventPhone = (event.host_phone || "").replace(/\D/g, "");
  if (
    inputPhone.length < 9 ||
    eventPhone.length < 9 ||
    eventPhone.endsWith("820000000") ||
    !eventPhone.endsWith(inputPhone.slice(-9))
  ) {
    return null;
  }

  const cleanCheck = (params.secretCheck || "").trim().toLowerCase();
  if (cleanCheck.length < 4) {
    return null;
  }

  const GENERIC_PIN_WORDS = new Set([
    "gate",
    "code",
    "estate",
    "secret",
    "access",
    "door",
    "unit",
    "pass",
    "club",
    "house",
    "park",
    "north",
    "south",
    "east",
    "west",
  ]);
  if (GENERIC_PIN_WORDS.has(cleanCheck)) {
    return null;
  }

  const pinText = (event.secret_location_pin || "").trim().toLowerCase();
  const pinDigits = pinText.replace(/\D/g, "");
  const accDigits = (event.host_account_number || "").replace(/\D/g, "");
  const checkDigits = cleanCheck.replace(/\D/g, "");

  let secondFactorVerified = false;
  if (accDigits.length >= 6) {
    // When the host has a linked bank account, require the last 6+ account digits (never exposed publicly)
    if (checkDigits.length >= 6 && accDigits.endsWith(checkDigits)) {
      secondFactorVerified = true;
    }
  } else if (pinText && cleanCheck.length >= 4) {
    // When no bank account is linked, require exact PIN match or trailing 4+ PIN digits
    if (
      cleanCheck === pinText ||
      (pinDigits.length >= 4 && checkDigits.length >= 4 && pinDigits.endsWith(checkDigits))
    ) {
      secondFactorVerified = true;
    }
  }

  if (!secondFactorVerified) {
    return null;
  }

  return {
    host_secret_token: event.host_secret_token,
    slug: event.slug,
    title: event.title,
  };
}

export async function toggleRsvpPrivacy(
  slug: string,
  swapToken: string,
  isAnonymous: boolean
): Promise<GuestRsvp | null> {
  const store = loadLocalStore();
  let event = store.events.find((e) => e.slug === slug);
  const sb = getSupabaseAdminClient();
  if (!event && sb) {
    try {
      const { data: remoteEvent } = await sb
        .from("events")
        .select("*")
        .eq("slug", slug)
        .single();
      if (remoteEvent) {
        const hydrated = hydrateRemoteEvent(remoteEvent as EventItem);
        store.events.unshift(hydrated);
        event = hydrated;
      }
    } catch {
      // Continue
    }
  }
  if (!event || !swapToken.trim()) return null;

  let rsvpIdx = store.rsvps.findIndex(
    (r) => r.event_id === event.id && r.swap_token === swapToken.trim()
  );
  if (rsvpIdx === -1 && sb) {
    try {
      const { data: remoteRsvp } = await sb
        .from("guest_rsvps")
        .select("*")
        .eq("event_id", event.id)
        .eq("swap_token", swapToken.trim())
        .single();
      if (remoteRsvp) {
        store.rsvps.unshift(hydrateRemoteRsvp(remoteRsvp as GuestRsvp));
        rsvpIdx = 0;
      }
    } catch {
      // Continue
    }
  }
  if (rsvpIdx === -1) return null;

  store.rsvps[rsvpIdx] = {
    ...store.rsvps[rsvpIdx],
    is_anonymous_on_wall: Boolean(isAnonymous),
  };
  saveLocalStore(store);
  if (sb) {
    try {
      await sb
        .from("guest_rsvps")
        .update({ is_anonymous_on_wall: Boolean(isAnonymous) })
        .eq("id", store.rsvps[rsvpIdx].id);
    } catch {
      // Ignore
    }
  }
  return { ...store.rsvps[rsvpIdx] };
}

export async function recoverGuestPass(params: {
  slug: string;
  buyerWhatsapp?: string;
  buyerName?: string;
}): Promise<{
  rsvp: GuestRsvp;
  order: Order | null;
  secret_location_pin: string | null;
  recovered_swap_token?: string | null;
} | null> {
  const store = loadLocalStore();
  let event = store.events.find((e) => e.slug === params.slug);
  const sb = getSupabaseAdminClient();
  if (!event && sb) {
    try {
      const { data: remoteEvent } = await sb
        .from("events")
        .select("*")
        .eq("slug", params.slug)
        .single();
      if (remoteEvent) {
        const hydrated = hydrateRemoteEvent(remoteEvent as EventItem);
        store.events.unshift(hydrated);
        event = hydrated;
      }
    } catch {
      // Continue
    }
  }
  if (!event) return null;

  const rawPhone = (params.buyerWhatsapp || "").replace(/\D/g, "");
  const normPhone =
    rawPhone.startsWith("0") && rawPhone.length === 10
      ? `27${rawPhone.slice(1)}`
      : rawPhone;
  const cleanName = (params.buyerName || "").trim().toLowerCase();

  // Require at least a valid 9-digit WhatsApp number (reject repeating-digit or placeholder dummy inputs) to prevent enumeration
  if (
    normPhone.length < 9 ||
    /^(\d)\1{7,}$/.test(normPhone.slice(-9)) ||
    normPhone.endsWith("768063638") ||
    normPhone.endsWith("820000000")
  ) {
    return null;
  }

  let matchedOrder = store.orders.find(
    (o) =>
      o.event_id === event!.id &&
      o.status === "paid" &&
      o.buyer_whatsapp.replace(/\D/g, "").endsWith(normPhone.slice(-9)) &&
      (!cleanName || o.buyer_name.toLowerCase().includes(cleanName))
  );

  if (!matchedOrder && sb) {
    try {
      const { data: remoteOrders } = await sb
        .from("orders")
        .select("*")
        .eq("event_id", event.id)
        .eq("status", "paid");
      if (Array.isArray(remoteOrders)) {
        matchedOrder = (remoteOrders as Order[]).find(
          (o) =>
            o.buyer_whatsapp.replace(/\D/g, "").endsWith(normPhone.slice(-9)) &&
            (!cleanName || o.buyer_name.toLowerCase().includes(cleanName))
        );
      }
    } catch {
      // Ignore
    }
  }

  if (matchedOrder) {
    let matchedRsvp = store.rsvps.find(
      (r) => r.event_id === event!.id && r.order_id === matchedOrder!.id
    );
    if (!matchedRsvp && sb) {
      try {
        const { data: remoteRsvp } = await sb
          .from("guest_rsvps")
          .select("*")
          .eq("event_id", event.id)
          .eq("order_id", matchedOrder.id)
          .single();
        if (remoteRsvp) {
          matchedRsvp = hydrateRemoteRsvp(remoteRsvp as GuestRsvp);
        }
      } catch {
        // Ignore
      }
    }
    if (matchedRsvp && matchedRsvp.status !== "refunded") {
      // SECURITY: Mask swap_token on the rsvp object so phone-only lookups never leak the transfer token,
      // while returning recovered_swap_token only when both 9-digit phone AND guestName (2+ chars) match!
      const verifiedTwoFactor =
        cleanName.length >= 2 &&
        matchedRsvp.guest_name.toLowerCase().includes(cleanName);
      const safeRsvp: GuestRsvp = {
        ...matchedRsvp,
        gate_pin: deriveGatePin(matchedRsvp.swap_token || matchedRsvp.id),
        swap_token: "",
        guest_whatsapp: null,
      };
      const safeOrder: Order = {
        ...matchedOrder,
        buyer_whatsapp: `***${matchedOrder.buyer_whatsapp.slice(-4)}`,
        buyer_email: "***@rsvp.pullthru.co.za",
      };
      return {
        rsvp: safeRsvp,
        order: safeOrder,
        secret_location_pin: event.secret_location_pin || null,
        recovered_swap_token: verifiedTwoFactor ? matchedRsvp.swap_token : null,
      };
    }
  }

  // Fallback for Direct PayShap / Capitec PayMe / Free RSVPs (where order_id is null)
  let candidateRsvps = store.rsvps.filter(
    (r) =>
      r.event_id === event!.id &&
      r.status !== "refunded" &&
      r.refund_status !== "refunded" &&
      (r.status === "locked_paid" ||
        r.status === "cash_logged" ||
        r.status === "going_free" ||
        r.status === "payday_promise")
  );
  if (sb) {
    try {
      const { data: remoteRsvps } = await sb
        .from("guest_rsvps")
        .select("*")
        .eq("event_id", event.id);
      if (Array.isArray(remoteRsvps) && remoteRsvps.length > 0) {
        candidateRsvps = (remoteRsvps as GuestRsvp[])
          .map(hydrateRemoteRsvp)
          .filter(
            (r) =>
              r.status !== "refunded" &&
              r.refund_status !== "refunded" &&
              (r.status === "locked_paid" ||
                r.status === "cash_logged" ||
                r.status === "going_free" ||
                r.status === "payday_promise")
          );
      }
    } catch {
      // Ignore
    }
  }

  const directMatchedRsvp = candidateRsvps.find((r) => {
    const rPhone = (r.guest_whatsapp || "").replace(/\D/g, "");
    if (rPhone.length < 9) {
      // Never match on guest_name alone if the RSVP has no stored phone number
      return false;
    }
    const phoneMatch = rPhone.endsWith(normPhone.slice(-9));
    const nameMatch =
      Boolean(cleanName && cleanName.length >= 2) &&
      r.guest_name.toLowerCase().includes(cleanName);
    return phoneMatch && (!cleanName || nameMatch);
  });

  if (directMatchedRsvp) {
    const verifiedTwoFactor =
      cleanName.length >= 2 &&
      directMatchedRsvp.guest_name.toLowerCase().includes(cleanName);
    const isUnconfirmedCashOrEft =
      directMatchedRsvp.pop_rail_badge === "standard_eft" ||
      Boolean(
        directMatchedRsvp.pop_reference_note?.includes(
          "Pending Host Confirmation"
        )
      );
    const safeRsvp: GuestRsvp = {
      ...directMatchedRsvp,
      gate_pin: deriveGatePin(directMatchedRsvp.swap_token || directMatchedRsvp.id),
      swap_token: "",
      guest_whatsapp: null,
    };
    return {
      rsvp: safeRsvp,
      order: null,
      secret_location_pin:
        !isUnconfirmedCashOrEft &&
        (event.mode === "free" ||
          Number(directMatchedRsvp.amount_contributed_zar) > 0)
          ? event.secret_location_pin || null
          : null,
      recovered_swap_token: verifiedTwoFactor ? directMatchedRsvp.swap_token : null,
    };
  }

  return null;
}

export async function requestOrProcessRefund(params: {
  slug?: string;
  eventId?: string;
  swapToken?: string;
  ref?: string;
  rsvpId?: string;
  reason: string;
  isHostInitiated?: boolean;
  isDisputeReport?: boolean;
  isWebhookEvent?: boolean;
}): Promise<{
  success: boolean;
  error?: string;
  statusCode?: number;
  rsvp?: GuestRsvp;
  order?: Order | null;
  event?: EventItem;
  refundReference?: string;
  payoutFrozen?: boolean;
  message?: string;
}> {
  const store = loadLocalStore();
  const sb = getSupabaseAdminClient();
  let eventIdx = store.events.findIndex(
    (e) =>
      (params.slug && e.slug === params.slug) ||
      (params.eventId && e.id === params.eventId)
  );
  if (eventIdx === -1 && sb) {
    try {
      const query = sb.from("events").select("*");
      const { data: remoteEvent } = params.slug
        ? await query.eq("slug", params.slug).single()
        : await query.eq("id", params.eventId!).single();
      if (remoteEvent) {
        store.events.unshift(hydrateRemoteEvent(remoteEvent as EventItem));
        eventIdx = 0;
      }
    } catch {
      // Continue
    }
  }
  if (eventIdx === -1) {
    return { success: false, error: "Event not found.", statusCode: 404 };
  }
  const event = store.events[eventIdx];

  // SECURITY (H10): Guest-initiated refund/dispute requires secret swapToken; bare `ref` is only accepted for verified host or Paystack webhook
  let rsvpIdx = -1;
  if ((params.isHostInitiated || params.isWebhookEvent) && params.rsvpId) {
    rsvpIdx = store.rsvps.findIndex(
      (r) => r.event_id === event.id && r.id === params.rsvpId
    );
    if (rsvpIdx === -1 && sb) {
      try {
        const { data: remoteRsvp } = await sb
          .from("guest_rsvps")
          .select("*")
          .eq("event_id", event.id)
          .eq("id", params.rsvpId)
          .single();
        if (remoteRsvp) {
          store.rsvps.unshift(hydrateRemoteRsvp(remoteRsvp as GuestRsvp));
          rsvpIdx = 0;
        }
      } catch {
        // Ignore
      }
    }
  } else if (params.swapToken && params.swapToken.trim()) {
    rsvpIdx = store.rsvps.findIndex(
      (r) => r.event_id === event.id && r.swap_token === params.swapToken!.trim()
    );
    if (rsvpIdx === -1 && sb) {
      try {
        const { data: remoteRsvp } = await sb
          .from("guest_rsvps")
          .select("*")
          .eq("event_id", event.id)
          .eq("swap_token", params.swapToken!.trim())
          .single();
        if (remoteRsvp) {
          store.rsvps.unshift(hydrateRemoteRsvp(remoteRsvp as GuestRsvp));
          rsvpIdx = 0;
        }
      } catch {
        // Ignore
      }
    }
  } else if (
    (params.isHostInitiated || params.isWebhookEvent) &&
    params.ref &&
    params.ref.trim()
  ) {
    let ord = store.orders.find(
      (o) => o.event_id === event.id && o.paystack_reference === params.ref!.trim()
    );
    if (!ord && sb) {
      try {
        const { data: remoteOrd } = await sb
          .from("orders")
          .select("*")
          .eq("event_id", event.id)
          .eq("paystack_reference", params.ref!.trim())
          .single();
        if (remoteOrd) {
          store.orders.unshift(remoteOrd as Order);
          ord = remoteOrd as Order;
        }
      } catch {
        // Ignore
      }
    }
    if (ord) {
      rsvpIdx = store.rsvps.findIndex(
        (r) => r.event_id === event.id && r.order_id === ord!.id
      );
      if (rsvpIdx === -1 && sb) {
        try {
          const { data: remoteRsvp } = await sb
            .from("guest_rsvps")
            .select("*")
            .eq("event_id", event.id)
            .eq("order_id", ord.id)
            .single();
          if (remoteRsvp) {
            store.rsvps.unshift(hydrateRemoteRsvp(remoteRsvp as GuestRsvp));
            rsvpIdx = 0;
          }
        } catch {
          // Ignore
        }
      }
    }
  } else if (!params.isHostInitiated && !params.isWebhookEvent && !params.swapToken?.trim()) {
    return {
      success: false,
      error: "A valid pass Swap Token is required to request a refund or report an issue.",
      statusCode: 403,
    };
  }

  if (rsvpIdx === -1) {
    return {
      success: false,
      error: "Verified paid pass or swap token not found for this event.",
      statusCode: 404,
    };
  }

  const rsvp = store.rsvps[rsvpIdx];

  // Prevent repeat refunds (H2)
  if (
    !params.isWebhookEvent &&
    (rsvp.status === "refunded" || rsvp.refund_status === "refunded")
  ) {
    return {
      success: false,
      error: "This spot has already been refunded.",
      statusCode: 400,
    };
  }

  // Anti-Double-Dip Guard: If spot was already swapped to a replacement player, block guest refund claims
  if (
    !params.isHostInitiated &&
    !params.isWebhookEvent &&
    (rsvp.swapped_at || (rsvp.comment || "").includes("Swapped from"))
  ) {
    return {
      success: false,
      error:
        "Double-Dip Protection: This spot was already transferred via 1-Tap Spot-Swap. Original buyers cannot claim a refund on a transferred spot.",
      statusCode: 400,
    };
  }

  // Direct Peer-to-Peer Guard: Events where guests paid the host directly via PayShap / Capitec PayMe / EFT have no PullThru escrow to freeze
  if (
    params.isDisputeReport &&
    (!rsvp.order_id || Boolean(rsvp.pop_hash)) &&
    !params.isWebhookEvent
  ) {
    return {
      success: false,
      error:
        "Direct Peer-to-Peer Event: Because you paid the host directly via PayShap / Capitec PayMe, PullThru does not hold funds in escrow. Please message the organiser directly on WhatsApp or use 1-Tap Spot-Swap.",
      statusCode: 400,
    };
  }

  // Sybil Guard: Only verified locked_paid guests can file payout-freezing disputes or gateway refunds
  if (params.isDisputeReport && rsvp.status !== "locked_paid" && !params.isWebhookEvent) {
    return {
      success: false,
      error:
        "Only verified paid spot holders can file an escrow payout dispute.",
      statusCode: 403,
    };
  }

  // Anti-Friendly-Fraud Guard: Guests who already checked in at the venue gate cannot claim "Host No-Show"
  if (
    params.isDisputeReport &&
    rsvp.checked_in &&
    !params.isHostInitiated &&
    !params.isWebhookEvent
  ) {
    return {
      success: false,
      error:
        "Gate Check-In Verified: Pass was already checked in at the venue. Post-attendance 'No-Show' freeze is blocked.",
      statusCode: 400,
    };
  }

  let refundReference = `RFD_PT_ZA_${Date.now()}_${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
  const cleanReason = String(params.reason || "Customer refund / dispute").trim().slice(0, 200);

  let matchedOrder: Order | null = null;
  if (rsvp.order_id) {
    let ordIdx = store.orders.findIndex((o) => o.id === rsvp.order_id);
    if (ordIdx === -1 && sb) {
      try {
        const { data: remoteOrd } = await sb
          .from("orders")
          .select("*")
          .eq("id", rsvp.order_id)
          .single();
        if (remoteOrd) {
          store.orders.unshift(remoteOrd as Order);
          ordIdx = 0;
        }
      } catch {
        // Ignore
      }
    }
    if (ordIdx !== -1) {
      const targetOrder = store.orders[ordIdx];
      store.orders[ordIdx] = {
        ...targetOrder,
        status: params.isDisputeReport ? "disputed" : "refunded_partial",
        refund_reference: refundReference,
        refund_reason: cleanReason,
        refunded_at: new Date().toISOString(),
      };
      matchedOrder = { ...store.orders[ordIdx] };
    }
  }

  // Release any claimed Bring-'n-Bak item back to the open squad checklist
  if (rsvp.claimed_item_id) {
    const item = (event.bring_items || []).find((b) => b.id === rsvp.claimed_item_id);
    if (item && item.claimed_rsvp_id === rsvp.id) {
      item.claimed_by_name = null;
      item.claimed_rsvp_id = null;
    }
  }

  const isFreeOrUnpaidWithdrawal =
    !params.isDisputeReport &&
    Number(rsvp.amount_contributed_zar || 0) === 0 &&
    (rsvp.status === "going_free" || rsvp.status === "payday_promise");

  // Terminal status "refunded" + rotated swap_token when refunded so pass cannot be reused or swapped (H2)
  const updatedRsvp: GuestRsvp = {
    ...rsvp,
    status: params.isDisputeReport ? rsvp.status : "refunded",
    swap_token: params.isDisputeReport
      ? rsvp.swap_token
      : `refunded-${crypto.randomBytes(12).toString("hex")}`,
    refund_status: params.isDisputeReport ? "disputed" : "refunded",
    refund_reason: cleanReason,
    refund_reference: refundReference,
    claimed_item_id: null,
    claimed_item_label: null,
    badge_label: params.isDisputeReport
      ? "🚨 Dispute Filed (Payout Review)"
      : isFreeOrUnpaidWithdrawal
      ? "👋 Spot Released"
      : !rsvp.order_id || Boolean(rsvp.pop_hash)
      ? "⏳ Spot Released (Direct Host Refund)"
      : "💸 Base Contribution Refunded",
  };
  store.rsvps[rsvpIdx] = updatedRsvp;

  // Calculate Sybil-resistant crowd-freeze threshold across distinct paid RSVPs (requires >=2 disputes AND >=25% of paid pool & >= R150)
  let allEventRsvps = store.rsvps.filter((r) => r.event_id === event.id);
  if (sb && params.isDisputeReport) {
    try {
      const { data: remoteAll } = await sb
        .from("guest_rsvps")
        .select("*")
        .eq("event_id", event.id);
      if (Array.isArray(remoteAll) && remoteAll.length > 0) {
        allEventRsvps = (remoteAll as GuestRsvp[]).map((r) =>
          r.id === updatedRsvp.id ? updatedRsvp : hydrateRemoteRsvp(r)
        );
      }
    } catch {
      // Ignore
    }
  }

  const totalPaidPoolZar = allEventRsvps
    .filter((r) => r.status === "locked_paid" || r.status === "refunded")
    .reduce((sum, r) => sum + (Number(r.amount_contributed_zar) || 0), 0);

  const disputedRsvps = allEventRsvps.filter(
    (r) => r.refund_status === "disputed" && Number(r.amount_contributed_zar) > 0
  );
  const disputedZar = disputedRsvps.reduce(
    (sum, r) => sum + (Number(r.amount_contributed_zar) || 0),
    0
  );
  const disputeCount = disputedRsvps.length;

  const shouldFreezePool =
    Boolean(event.payout_frozen) ||
    (params.isDisputeReport &&
      disputeCount >= 2 &&
      disputedZar >= 150 &&
      totalPaidPoolZar > 0 &&
      disputedZar / totalPaidPoolZar >= 0.25);

  event.dispute_count = disputeCount;
  event.disputed_zar = disputedZar;
  event.payout_frozen = shouldFreezePool;
  if (shouldFreezePool) {
    event.settlement_schedule = "manual";
  }
  store.events[eventIdx] = event;
  saveLocalStore(store);

  if (sb) {
    try {
      if (matchedOrder) {
        const { error: oErr } = await sb
          .from("orders")
          .update({
            status: matchedOrder.status,
            refund_reference: matchedOrder.refund_reference,
            refund_reason: matchedOrder.refund_reason,
            refunded_at: matchedOrder.refunded_at,
          })
          .eq("id", matchedOrder.id);
        if (oErr) {
          await sb
            .from("orders")
            .update(
              packFallbackOrderDbRecord({
                status: matchedOrder.status,
              })
            )
            .eq("id", matchedOrder.id);
        }
      }
      const rsvpPatch: Partial<GuestRsvp> = {
        status: updatedRsvp.status,
        swap_token: updatedRsvp.swap_token,
        refund_status: updatedRsvp.refund_status,
        refund_reason: updatedRsvp.refund_reason,
        refund_reference: updatedRsvp.refund_reference,
        claimed_item_id: null,
        claimed_item_label: null,
        badge_label: updatedRsvp.badge_label,
      };
      const { error: rErr } = await sb
        .from("guest_rsvps")
        .update(rsvpPatch)
        .eq("id", updatedRsvp.id);
      if (rErr) {
        await sb
          .from("guest_rsvps")
          .update(
            packFallbackRsvpDbRecord({
              ...rsvpPatch,
              custom_answer: updatedRsvp.custom_answer,
              payment_channel: updatedRsvp.payment_channel,
              swapped_at: updatedRsvp.swapped_at,
              pop_hash: updatedRsvp.pop_hash,
              pop_rail_badge: updatedRsvp.pop_rail_badge,
              pop_reference_note: updatedRsvp.pop_reference_note,
              guest_whatsapp: updatedRsvp.guest_whatsapp,
            })
          )
          .eq("id", updatedRsvp.id);
      }
      const { error: evErr } = await sb
        .from("events")
        .update({
          bring_items: event.bring_items,
          dispute_count: event.dispute_count,
          disputed_zar: event.disputed_zar,
          payout_frozen: event.payout_frozen,
          settlement_schedule: event.settlement_schedule,
        })
        .eq("id", event.id);
      if (evErr) {
        await sb
          .from("events")
          .update({
            bring_items: event.bring_items,
            settlement_schedule: event.settlement_schedule,
          })
          .eq("id", event.id);
      }
    } catch {
      // Ignore if columns not yet migrated on remote DB
    }
  }

  return {
    success: true,
    rsvp: { ...updatedRsvp },
    order: matchedOrder,
    event: { ...event },
    refundReference,
    payoutFrozen: shouldFreezePool,
    message: shouldFreezePool
      ? `🚨 Buyer Protection Kill-Switch Activated: Host payout is FROZEN (${disputeCount} verified paid disputes / R${disputedZar} flagged). Ref: ${refundReference}.`
      : params.isDisputeReport
      ? `🛡️ Dispute logged for R${rsvp.amount_contributed_zar} (Ref: ${refundReference}).`
      : isFreeOrUnpaidWithdrawal
      ? `👋 Your spot and any claimed Bring-'n-Bak item have been released back to the squad.`
      : !rsvp.order_id || Boolean(rsvp.pop_hash)
      ? `💸 Refund logged for R${rsvp.amount_contributed_zar} (Ref: ${refundReference}). Your spot has been released so the host can return your contribution directly via PayShap / EFT.`
      : `💸 Refund initiated for R${rsvp.amount_contributed_zar} Base Contribution (Ref: ${refundReference}). Standard SA bank card reversals reflect in 3–10 business days.`,
  };
}

export async function cancelEventAndRefundAll(
  slug: string,
  reason: string = "Host cancelled event — 100% refund to squad"
): Promise<{
  event: EventItem;
  refundedCount: number;
  batchRefundReference: string;
} | null> {
  const store = loadLocalStore();
  const sb = getSupabaseAdminClient();
  let eventIdx = store.events.findIndex((e) => e.slug === slug);
  if (sb) {
    try {
      const { data: remoteEvent } = await sb
        .from("events")
        .select("*")
        .eq("slug", slug)
        .single();
      if (remoteEvent) {
        const hydrated = hydrateRemoteEvent(remoteEvent as EventItem);
        if (eventIdx === -1) {
          store.events.unshift(hydrated);
          eventIdx = 0;
        } else {
          store.events[eventIdx] = { ...store.events[eventIdx], ...hydrated };
        }
      }
      const { data: remoteRsvps } = await sb
        .from("guest_rsvps")
        .select("*")
        .eq("event_id", store.events[eventIdx]?.id || "");
      if (Array.isArray(remoteRsvps) && remoteRsvps.length > 0) {
        const hydratedRsvps = (remoteRsvps as GuestRsvp[]).map(hydrateRemoteRsvp);
        const existingIds = new Set(store.rsvps.map((r) => r.id));
        for (const rr of hydratedRsvps) {
          if (!existingIds.has(rr.id)) {
            store.rsvps.push(rr);
          }
        }
      }
    } catch {
      // Continue
    }
  }
  if (eventIdx === -1) return null;

  const event = store.events[eventIdx];
  const batchRefundReference = `RFD_BATCH_PT_${Date.now()}`;
  let refundedCount = 0;
  const refundedRsvpsToPersist: GuestRsvp[] = [];

  store.rsvps = store.rsvps.map((r) => {
    if (r.event_id !== event.id) return r;
    if (
      (r.status === "locked_paid" || r.status === "cash_logged") &&
      r.refund_status !== "refunded"
    ) {
      refundedCount += 1;
      const isDirectP2P = !r.order_id || Boolean(r.pop_hash) || r.status === "cash_logged";
      const updatedR: GuestRsvp = {
        ...r,
        status: "refunded",
        refund_status: "refunded",
        refund_reason: reason,
        refund_reference: `${batchRefundReference}_${refundedCount}`,
        claimed_item_id: null,
        claimed_item_label: null,
        badge_label: isDirectP2P
          ? "⏳ Event Cancelled — Host Direct Refund Due"
          : "💸 Event Cancelled — Refunded",
      };
      refundedRsvpsToPersist.push(updatedR);
      return updatedR;
    }
    return r;
  });

  if (Array.isArray(event.bring_items)) {
    event.bring_items = event.bring_items.map((item) => ({
      ...item,
      claimed_by_name: null,
      claimed_rsvp_id: null,
    }));
  }

  for (let i = 0; i < store.orders.length; i++) {
    const o = store.orders[i];
    if (o.event_id !== event.id || o.status !== "paid") continue;
    store.orders[i] = {
      ...o,
      status: "refunded_partial",
      refund_reference: batchRefundReference,
      refund_reason: reason,
      refunded_at: new Date().toISOString(),
    };
  }

  event.is_cancelled = true;
  event.is_active = false;
  event.payout_frozen = true;
  store.events[eventIdx] = event;
  saveLocalStore(store);

  if (sb) {
    try {
      for (const rr of refundedRsvpsToPersist) {
        const rPatch: Partial<GuestRsvp> = {
          status: rr.status,
          refund_status: rr.refund_status,
          refund_reason: rr.refund_reason,
          refund_reference: rr.refund_reference,
          claimed_item_id: null,
          claimed_item_label: null,
          badge_label: rr.badge_label,
        };
        const { error: rErr } = await sb
          .from("guest_rsvps")
          .update(rPatch)
          .eq("id", rr.id);
        if (rErr) {
          await sb
            .from("guest_rsvps")
            .update(
              packFallbackRsvpDbRecord({
                ...rPatch,
                custom_answer: rr.custom_answer,
                payment_channel: rr.payment_channel,
                swapped_at: rr.swapped_at,
                pop_hash: rr.pop_hash,
                pop_rail_badge: rr.pop_rail_badge,
                pop_reference_note: rr.pop_reference_note,
                guest_whatsapp: rr.guest_whatsapp,
              })
            )
            .eq("id", rr.id);
        }
      }

      const { error: evErr } = await sb
        .from("events")
        .update({
          is_active: false,
          is_cancelled: true,
          payout_frozen: true,
          bring_items: event.bring_items,
        })
        .eq("id", event.id);
      if (evErr) {
        await sb
          .from("events")
          .update(packFallbackEventDbRecord(event))
          .eq("id", event.id);
      }
    } catch {
      // Ignore
    }
  }

  return {
    event: { ...event },
    refundedCount,
    batchRefundReference,
  };
}

// ============================================================================
// SILENT AUTO-ERROR & DIAGNOSTIC TELEMETRY PERSISTENCE (POPIA SAFE)
// ============================================================================
import {
  TelemetryReportInput,
  TelemetryEventRecord,
  sanitizeTelemetryPayload,
} from "@/lib/telemetry";

const inMemoryTelemetryBuffer: TelemetryEventRecord[] = [];
const MAX_TELEMETRY_BUFFER = 200;

export async function recordTelemetryError(
  input: TelemetryReportInput
): Promise<TelemetryEventRecord> {
  const sanitized = sanitizeTelemetryPayload(input);
  inMemoryTelemetryBuffer.unshift(sanitized);
  if (inMemoryTelemetryBuffer.length > MAX_TELEMETRY_BUFFER) {
    inMemoryTelemetryBuffer.length = MAX_TELEMETRY_BUFFER;
  }

  // Persist to Supabase orders table as a sentinel telemetry row in production (zero schema migration required)
  const sb = getSupabaseAdminClient();
  if (sb && process.env.NODE_ENV === "production") {
    try {
      const isFunnel = sanitized.type === "funnel_step";
      const telemetryOrderRow = {
        id: sanitized.id,
        event_id: "evt-1",
        profile_id: "prof-1",
        buyer_name: (isFunnel
          ? `[FNL:${sanitized.message}] ${sanitized.route}`
          : `[ERR:${sanitized.type}] ${sanitized.route}`
        ).slice(0, 80),
        buyer_whatsapp: sanitized.clientPlatform.slice(0, 40),
        buyer_email: "telemetry@pullthru.co.za",
        is_synthetic_email: true,
        spots_count: 1,
        plus_one_names: [
          sanitized.message,
          sanitized.stack || "",
          `viewport=${sanitized.viewport} | net=${sanitized.connectionType}`,
          ...(sanitized.recentLogs || []),
          ...(sanitized.notes ? [`notes=${sanitized.notes}`] : []),
        ].filter(Boolean),
        tier_id: isFunnel ? "TELEMETRY_FUNNEL" : "TELEMETRY_ERROR",
        tier_label: sanitized.type,
        base_price_cents: 5000,
        platform_fee_cents: 0,
        total_charged_cents: 5000,
        paystack_reference: sanitized.reference,
        payment_channel: "card",
        settled_to_host: false,
        cpa_s49_accepted: true,
        status: "pending",
        created_at: sanitized.created_at,
      };
      await sb.from("orders").insert(telemetryOrderRow);
    } catch {
      // Never block or throw on telemetry write
    }
  }

  return sanitized;
}

export async function listTelemetryErrors(
  limit = 30
): Promise<TelemetryEventRecord[]> {
  const safeLimit = Math.max(1, Math.min(100, limit));
  const combined = new Map<string, TelemetryEventRecord>();

  for (const item of inMemoryTelemetryBuffer) {
    if (item.type === "funnel_step") continue;
    combined.set(item.reference, item);
  }

  const sb = getSupabaseAdminClient();
  if (sb) {
    try {
      const { data } = await sb
        .from("orders")
        .select("*")
        .like("paystack_reference", "ERR_TELEMETRY_%")
        .order("created_at", { ascending: false })
        .limit(safeLimit);

      if (Array.isArray(data)) {
        for (const row of data) {
          const ref = String(row.paystack_reference || "");
          if (!ref || combined.has(ref)) continue;
          const details: string[] = Array.isArray(row.plus_one_names)
            ? row.plus_one_names.map(String)
            : [];
          const message = details[0] || String(row.buyer_name || "Error");
          const stack =
            details[1] && !details[1].startsWith("viewport=")
              ? details[1]
              : null;
          const metaLine =
            details.find((d) => d.startsWith("viewport=")) || "";
          const vpMatch = metaLine.match(/viewport=([^|]+)/);
          const netMatch = metaLine.match(/net=([^|]+)/);
          const notesLine = details.find((d) => d.startsWith("notes="));
          const recentLogs = details.filter(
            (d, i) =>
              i > 0 &&
              d !== stack &&
              !d.startsWith("viewport=") &&
              !d.startsWith("notes=")
          );

          const buyerName = String(row.buyer_name || "");
          const routeMatch = buyerName.match(/^\[ERR:[^\]]+\]\s*(.+)$/);

          combined.set(ref, {
            id: String(row.id || ref),
            reference: ref,
            type: (row.tier_label || "window_error") as TelemetryEventRecord["type"],
            message,
            stack,
            route: routeMatch ? routeMatch[1].trim() : "/",
            clientPlatform: String(row.buyer_whatsapp || "Unknown"),
            viewport: vpMatch ? vpMatch[1].trim() : "unknown",
            connectionType: netMatch ? netMatch[1].trim() : "4g/wifi",
            recentLogs,
            notes: notesLine ? notesLine.slice("notes=".length) : null,
            created_at: String(row.created_at || new Date().toISOString()),
          });
        }
      }
    } catch {
      // Fallback to in-memory buffer
    }
  }

  return Array.from(combined.values())
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, safeLimit);
}

export async function listFunnelTelemetry(
  limit = 60
): Promise<{
  steps: TelemetryEventRecord[];
  countsByStep: Record<string, number>;
}> {
  const safeLimit = Math.max(1, Math.min(200, limit));
  const combined = new Map<string, TelemetryEventRecord>();

  for (const item of inMemoryTelemetryBuffer) {
    if (item.type !== "funnel_step") continue;
    combined.set(item.reference, item);
  }

  const sb = getSupabaseAdminClient();
  if (sb) {
    try {
      const { data } = await sb
        .from("orders")
        .select("*")
        .like("paystack_reference", "FUNNEL_TELEMETRY_%")
        .order("created_at", { ascending: false })
        .limit(safeLimit);

      if (Array.isArray(data)) {
        for (const row of data) {
          const ref = String(row.paystack_reference || "");
          if (!ref || combined.has(ref)) continue;
          const details: string[] = Array.isArray(row.plus_one_names)
            ? row.plus_one_names.map(String)
            : [];
          const message = details[0] || "funnel_step";
          const metaLine =
            details.find((d) => d.startsWith("viewport=")) || "";
          const vpMatch = metaLine.match(/viewport=([^|]+)/);
          const netMatch = metaLine.match(/net=([^|]+)/);
          const notesLine = details.find((d) => d.startsWith("notes="));
          const buyerName = String(row.buyer_name || "");
          const routeMatch = buyerName.match(/^\[FNL:[^\]]+\]\s*(.+)$/);

          combined.set(ref, {
            id: String(row.id || ref),
            reference: ref,
            type: "funnel_step",
            message,
            stack: null,
            route: routeMatch ? routeMatch[1].trim() : "/create",
            clientPlatform: String(row.buyer_whatsapp || "Unknown"),
            viewport: vpMatch ? vpMatch[1].trim() : "unknown",
            connectionType: netMatch ? netMatch[1].trim() : "4g/wifi",
            recentLogs: [],
            notes: notesLine ? notesLine.slice("notes=".length) : null,
            created_at: String(row.created_at || new Date().toISOString()),
          });
        }
      }
    } catch {
      // Fallback to in-memory buffer
    }
  }

  const steps = Array.from(combined.values())
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, safeLimit);

  const countsByStep: Record<string, number> = {};
  for (const s of steps) {
    countsByStep[s.message] = (countsByStep[s.message] || 0) + 1;
  }

  return { steps, countsByStep };
}
