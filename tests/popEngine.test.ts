import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  parseSaBankSms,
  validatePopFile,
  computeCanonicalSmsHash,
  extractZarAmountFromSms,
  SAMPLE_REAL_POPS,
  SAMPLE_FAKE_POPS,
} from "../src/lib/popEngine";

describe("South African Proof-of-Payment (POP) Verification Engine (src/lib/popEngine.ts)", () => {
  describe("1. Authentic Bank SMS Parsing (All SA Banks)", () => {
    it("parses Capitec standard transfer and extracts R150 amount and reference", () => {
      const result = parseSaBankSms(SAMPLE_REAL_POPS.capitec_standard, 150);
      assert.equal(result.isValid, true);
      assert.equal(result.isFake, false);
      assert.equal(result.bankId, "capitec");
      assert.equal(result.detectedAmountZar, 150);
      assert.equal(result.isUnderpaid, false);
      assert.equal(result.reference, "PT-JABU");
      assert.match(result.canonicalHash, /^pop_sms_[a-f0-9]{64}$/);
    });

    it("parses Capitec PayMe and extracts R222 amount and reference", () => {
      const result = parseSaBankSms(SAMPLE_REAL_POPS.capitec_payme, 222);
      assert.equal(result.isValid, true);
      assert.equal(result.isFake, false);
      assert.equal(result.bankId, "capitec");
      assert.equal(result.paymentRail, "capitec_payme");
      assert.equal(result.detectedAmountZar, 222);
      assert.equal(result.reference, "PT-JABU");
    });

    it("parses FNB standard payment (extracts R250, ignores R1,200.00 balance)", () => {
      const result = parseSaBankSms(SAMPLE_REAL_POPS.fnb_standard, 250);
      assert.equal(result.isValid, true);
      assert.equal(result.isFake, false);
      assert.equal(result.bankId, "fnb");
      assert.equal(result.detectedAmountZar, 250); // NOT 1200!
      assert.equal(result.reference, "PT-JABU");
    });

    it("parses FNB PayShap instant payment and selects instant_payshap rail", () => {
      const result = parseSaBankSms(SAMPLE_REAL_POPS.fnb_payshap, 150);
      assert.equal(result.isValid, true);
      assert.equal(result.isFake, false);
      assert.equal(result.bankId, "fnb");
      assert.equal(result.paymentRail, "instant_payshap");
      assert.equal(result.detectedAmountZar, 150);
      assert.equal(result.reference, "PT-SIPHO");
    });

    it("parses Standard Bank payment (extracts R250, ignores R3,410.00 balance)", () => {
      const result = parseSaBankSms(SAMPLE_REAL_POPS.standard_bank, 250);
      assert.equal(result.isValid, true);
      assert.equal(result.isFake, false);
      assert.equal(result.bankId, "standard_bank");
      assert.equal(result.detectedAmountZar, 250);
      assert.equal(result.reference, "PT-JABU");
    });

    it("parses Nedbank payment (extracts R220, ignores R4,300.00 balance)", () => {
      const result = parseSaBankSms(SAMPLE_REAL_POPS.nedbank, 220);
      assert.equal(result.isValid, true);
      assert.equal(result.isFake, false);
      assert.equal(result.bankId, "nedbank");
      assert.equal(result.detectedAmountZar, 220);
      assert.equal(result.reference, "PT-JABU");
    });

    it("parses Absa Notice of Payment (extracts R220, ignores R2,150.00 balance)", () => {
      const result = parseSaBankSms(SAMPLE_REAL_POPS.absa, 220);
      assert.equal(result.isValid, true);
      assert.equal(result.isFake, false);
      assert.equal(result.bankId, "absa");
      assert.equal(result.detectedAmountZar, 220);
      assert.equal(result.reference, "PT-JABU");
    });

    it("parses TymeBank payment (extracts R220, ignores R800.00 balance)", () => {
      const result = parseSaBankSms(SAMPLE_REAL_POPS.tymebank, 220);
      assert.equal(result.isValid, true);
      assert.equal(result.isFake, false);
      assert.equal(result.bankId, "tymebank");
      assert.equal(result.detectedAmountZar, 220);
      assert.equal(result.reference, "PT-JABU");
    });

    it("parses Discovery Bank payment (extracts R220, ignores R5,600.00 balance)", () => {
      const result = parseSaBankSms(SAMPLE_REAL_POPS.discovery, 220);
      assert.equal(result.isValid, true);
      assert.equal(result.isFake, false);
      assert.equal(result.bankId, "discovery");
      assert.equal(result.detectedAmountZar, 220);
      assert.equal(result.reference, "PT-JABU");
    });

    it("parses Direct PayShap notification and assigns instant_payshap rail", () => {
      const result = parseSaBankSms(SAMPLE_REAL_POPS.payshap_direct, 220);
      assert.equal(result.isValid, true);
      assert.equal(result.isFake, false);
      assert.equal(result.bankId, "payshap");
      assert.equal(result.paymentRail, "instant_payshap");
      assert.equal(result.detectedAmountZar, 220);
      assert.equal(result.reference, "PT-JABU");
    });

    it("accepts rounded-up payments (overpayment allowed e.g. R250 paid for R222 ticket)", () => {
      const result = parseSaBankSms(SAMPLE_REAL_POPS.fnb_standard, 222);
      assert.equal(result.isValid, true);
      assert.equal(result.isUnderpaid, false);
      assert.equal(result.detectedAmountZar, 250);
    });
  });

  describe("2. Fake & Fraudulent POP Detection (All Fraud Vectors Blocked)", () => {
    it("detects and rejects Airtime / Data purchases", () => {
      const result = parseSaBankSms(SAMPLE_FAKE_POPS.airtime, 50);
      assert.equal(result.isValid, false);
      assert.equal(result.isFake, true);
      assert.match(result.rejectionReason || "", /airtime or mobile data/i);
    });

    it("detects and rejects ATM / Cash withdrawals", () => {
      const result = parseSaBankSms(SAMPLE_FAKE_POPS.atm_withdrawal, 500);
      assert.equal(result.isValid, false);
      assert.equal(result.isFake, true);
      assert.match(result.rejectionReason || "", /cash or atm withdrawal/i);
    });

    it("detects and rejects Retail in-store POS card swipes (Checkers)", () => {
      const result = parseSaBankSms(SAMPLE_FAKE_POPS.retail_swipe, 349.5);
      assert.equal(result.isValid, false);
      assert.equal(result.isFake, true);
      assert.match(result.rejectionReason || "", /retail store card swipe/i);
    });

    it("detects and rejects Bank Debit Orders (Planet Fitness)", () => {
      const result = parseSaBankSms(SAMPLE_FAKE_POPS.debit_order, 250);
      assert.equal(result.isValid, false);
      assert.equal(result.isFake, true);
      assert.match(result.rejectionReason || "", /bank debit order/i);
    });

    it("detects and rejects Prepaid Electricity / Utility purchases", () => {
      const result = parseSaBankSms(SAMPLE_FAKE_POPS.prepaid_electricity, 200);
      assert.equal(result.isValid, false);
      assert.equal(result.isFake, true);
      assert.match(result.rejectionReason || "", /prepaid electricity/i);
    });

    it("detects and rejects Incoming Deposits / Salaries (wrong direction)", () => {
      const result = parseSaBankSms(SAMPLE_FAKE_POPS.inward_deposit, 500);
      assert.equal(result.isValid, false);
      assert.equal(result.isFake, true);
      assert.match(result.rejectionReason || "", /incoming deposit or salary/i);
    });

    it("detects and rejects Betting Vouchers (Hollywoodbets)", () => {
      const result = parseSaBankSms(SAMPLE_FAKE_POPS.betting_voucher, 200);
      assert.equal(result.isValid, false);
      assert.equal(result.isFake, true);
      assert.match(result.rejectionReason || "", /betting voucher/i);
    });

    it("detects and rejects Casual Chat / Social Engineering ('paid bro')", () => {
      const result = parseSaBankSms(SAMPLE_FAKE_POPS.casual_chat_1, 200);
      assert.equal(result.isValid, false);
      assert.equal(result.isFake, true);
      assert.match(result.rejectionReason || "", /unrecognized pop format/i);
    });

    it("detects and rejects Casual Chat ('sent on whatsapp 0821234567')", () => {
      const result = parseSaBankSms(SAMPLE_FAKE_POPS.casual_chat_2, 200);
      assert.equal(result.isValid, false);
      assert.equal(result.isFake, true);
      assert.match(result.rejectionReason || "", /unrecognized pop format/i);
    });

    it("detects and rejects Underpayment (R20 paid for R150 spot)", () => {
      const result = parseSaBankSms(SAMPLE_FAKE_POPS.underpaid_capitec, 150);
      assert.equal(result.isValid, false);
      assert.equal(result.isFake, true);
      assert.equal(result.isUnderpaid, true);
      assert.equal(result.detectedAmountZar, 20);
      assert.match(result.rejectionReason || "", /underpaid amount.*R20\.00.*R150\.00/i);
    });
  });

  describe("3. Canonical SHA-256 Deduplication (Anti-Replay Attack)", () => {
    it("computes identical SHA-256 hash regardless of 'SMS:' prefix, uppercase/lowercase, or extra whitespace", () => {
      const raw1 = "Capitec: R150.00 paid to Tariq from savings. Ref PT-JABU";
      const raw2 = "SMS:   capitec:   r150.00   paid   to   tariq   from   savings.   ref   pt-jabu  \n";
      const hash1 = computeCanonicalSmsHash(raw1);
      const hash2 = computeCanonicalSmsHash(raw2);

      assert.equal(hash1, hash2);
      assert.match(hash1, /^pop_sms_[a-f0-9]{64}$/);
    });
  });

  describe("4. Proof-of-Payment File Validation", () => {
    it("rejects 0-byte or corrupted slips (< 1 KB)", () => {
      const result = validatePopFile({ name: "slip.png", size: 500 });
      assert.equal(result.isValid, false);
      assert.match(result.rejectionReason || "", /empty or corrupted/i);
    });

    it("rejects files over 15 MB", () => {
      const result = validatePopFile({ name: "huge.png", size: 20 * 1024 * 1024 });
      assert.equal(result.isValid, false);
      assert.match(result.rejectionReason || "", /too large/i);
    });

    it("rejects dangerous or invalid extensions (.exe, .bat, .txt)", () => {
      const r1 = validatePopFile({ name: "hack.exe", size: 50000 });
      assert.equal(r1.isValid, false);

      const r2 = validatePopFile({ name: "test.txt", size: 50000 });
      assert.equal(r2.isValid, false);
    });

    it("accepts valid screenshot PNG, JPEG, and PDF slips", () => {
      const r1 = validatePopFile({ name: "capitec_slip.png", size: 120000 });
      assert.equal(r1.isValid, true);

      const r2 = validatePopFile({ name: "fnb_receipt.pdf", size: 350000 });
      assert.equal(r2.isValid, true);
    });
  });
});
