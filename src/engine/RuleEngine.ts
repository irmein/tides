import { AdaptiveRule, EvaluationContext, RuleResult } from './rules/base.rule';
import { BatteryMvpRule } from './rules/batteryMvp.rule';
import { ZombieDayRule } from './rules/zombieDay.rule';
import { JoyRatioCapRule } from './rules/joyRatioCap.rule';
import { StaticDecayRule } from './rules/staticDecay.rule';
import { db } from '../storage/db';

export class RuleEngine {
  private static registeredRules: AdaptiveRule[] = [
    BatteryMvpRule,
    JoyRatioCapRule,
    ZombieDayRule,
    StaticDecayRule,
  ].sort((a, b) => b.priority - a.priority);

  /** Register additional pluggable rules at runtime */
  public static registerRule(rule: AdaptiveRule): void {
    if (!this.registeredRules.some((r) => r.id === rule.id)) {
      this.registeredRules.push(rule);
      this.registeredRules.sort((a, b) => b.priority - a.priority);
    }
  }

  /** Retrieve all active registered rules */
  public static getRegisteredRules(): AdaptiveRule[] {
    return [...this.registeredRules];
  }

  /** Run evaluation against all active rules */
  public static async evaluate(ctx: EvaluationContext): Promise<RuleResult[]> {
    const triggeredResults: RuleResult[] = [];

    for (const rule of this.registeredRules) {
      try {
        const result = rule.evaluate(ctx);
        if (result && result.triggered) {
          triggeredResults.push(result);

          // Write to audit trail in Dexie
          try {
            await db.rule_audit_logs.put({
              id: crypto.randomUUID(),
              timestamp: new Date().toISOString(),
              ruleId: result.ruleId,
              ruleName: result.ruleName,
              actionType: result.actionType,
              payload: result.payload,
              reason: result.reason,
            });
          } catch (storageErr) {
            console.warn('Could not record rule audit log to IndexedDB:', storageErr);
          }

          // If a priority 100 critical safety rule triggered, stop downstream non-essential overrides
          if (rule.priority >= 100) {
            break;
          }
        }
      } catch (err) {
        console.error(`Rule ${rule.id} failed evaluation:`, err);
      }
    }

    return triggeredResults;
  }
}
