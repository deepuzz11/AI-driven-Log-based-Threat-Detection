#!/usr/bin/env python3
"""
Analysis History Storage - Persistent data layer for threat detection analysis
Stores all analysis results, rules, and detection history for reporting and auditing
"""

import json
import os
from datetime import datetime
from pathlib import Path

class AnalysisHistory:
    """Manages persistent storage of analysis results and detection events"""
    
    def __init__(self, base_dir="analysis_history"):
        self.base_dir = Path(base_dir)
        self.base_dir.mkdir(exist_ok=True)
        
        # Create subdirectories
        self.analysis_dir = self.base_dir / "analysis_results"
        self.detection_dir = self.base_dir / "detection_events"
        self.rules_dir = self.base_dir / "rules_log"
        self.stats_dir = self.base_dir / "statistics"
        
        for d in [self.analysis_dir, self.detection_dir, self.rules_dir, self.stats_dir]:
            d.mkdir(exist_ok=True)
        
        # Main index files
        self.analysis_index = self.base_dir / "analysis_index.jsonl"
        self.detection_log = self.base_dir / "detection_log.jsonl"
        self.rules_log = self.rules_dir / "rules_history.jsonl"
        self.stats_file = self.base_dir / "daily_stats.json"
    
    def save_analysis(self, analysis_result, sample_index):
        """Save analysis result to history"""
        try:
            timestamp = datetime.now().isoformat()
            
            # Create analysis record
            record = {
                "timestamp": timestamp,
                "sample_index": sample_index,
                "method": analysis_result.get("method"),
                "decision": analysis_result.get("decision"),
                "prediction": analysis_result.get("prediction"),
                "confidence": analysis_result.get("confidence"),
                "rule_hits_count": len(analysis_result.get("rule_hits", [])),
                "total_time_ms": analysis_result.get("total_time_ms"),
            }
            
            # Save to index (for fast querying)
            with open(self.analysis_index, "a") as f:
                f.write(json.dumps(record) + "\n")
            
            # Save full analysis to file
            analysis_file = self.analysis_dir / f"{timestamp.replace(':', '-').replace('.', '_')}.json"
            with open(analysis_file, "w") as f:
                json.dump(analysis_result, f, indent=2)
            
            # If it's a detection, add to detection log
            if analysis_result.get("decision") == "ATTACK":
                detection_record = {
                    "timestamp": timestamp,
                    "sample_index": sample_index,
                    "attack_type": analysis_result.get("prediction"),
                    "method": analysis_result.get("method"),
                    "rules_matched": len(analysis_result.get("rule_hits", [])),
                }
                with open(self.detection_log, "a") as f:
                    f.write(json.dumps(detection_record) + "\n")
            
            return True
        except Exception as e:
            print(f"[ERROR] Failed to save analysis: {e}")
            return False
    
    def save_rule_action(self, action, rule_name, rule_data=None):
        """Log rule additions/updates"""
        try:
            record = {
                "timestamp": datetime.now().isoformat(),
                "action": action,
                "rule_name": rule_name,
                "rule_data": rule_data
            }
            with open(self.rules_log, "a") as f:
                f.write(json.dumps(record) + "\n")
            return True
        except Exception as e:
            print(f"[ERROR] Failed to log rule action: {e}")
            return False
    
    def get_analysis_stats(self):
        """Get statistics from saved analyses"""
        try:
            total_analyses = 0
            total_attacks = 0
            total_benign = 0
            attack_by_type = {}
            detection_by_method = {"rule-based": 0, "ml-fallback": 0}
            
            if self.analysis_index.exists():
                with open(self.analysis_index, "r") as f:
                    for line in f:
                        try:
                            record = json.loads(line)
                            total_analyses += 1
                            if record.get("decision") == "ATTACK":
                                total_attacks += 1
                                method = record.get("method", "unknown")
                                if method in detection_by_method:
                                    detection_by_method[method] += 1
                                attack_type = record.get("prediction", "unknown")
                                attack_by_type[attack_type] = attack_by_type.get(attack_type, 0) + 1
                            else:
                                total_benign += 1
                        except:
                            pass
            
            return {
                "total_analyses": total_analyses,
                "total_attacks": total_attacks,
                "total_benign": total_benign,
                "attack_detection_rate": (total_attacks * 100) // total_analyses if total_analyses > 0 else 0,
                "attacks_by_type": attack_by_type,
                "detection_by_method": detection_by_method,
            }
        except Exception as e:
            print(f"[ERROR] Failed to get analysis stats: {e}")
            return {}
    
    def get_recent_analyses(self, limit=50):
        """Get recent analysis records"""
        try:
            records = []
            if self.analysis_index.exists():
                with open(self.analysis_index, "r") as f:
                    lines = f.readlines()
                    for line in lines[-limit:]:
                        try:
                            record = json.loads(line)
                            records.append(record)
                        except:
                            pass
            return records
        except Exception as e:
            print(f"[ERROR] Failed to get recent analyses: {e}")
            return []
    
    def get_recent_detections(self, limit=50):
        """Get recent attack detections"""
        try:
            records = []
            if self.detection_log.exists():
                with open(self.detection_log, "r") as f:
                    lines = f.readlines()
                    for line in lines[-limit:]:
                        try:
                            record = json.loads(line)
                            records.append(record)
                        except:
                            pass
            return records
        except Exception as e:
            print(f"[ERROR] Failed to get recent detections: {e}")
            return []

# Global history instance
analysis_history = AnalysisHistory()

if __name__ == "__main__":
    print(f"Analysis History Storage initialized at: {analysis_history.base_dir.absolute()}")
    print(f"Directories created:")
    print(f"  - Analysis results: {analysis_history.analysis_dir}")
    print(f"  - Detection events: {analysis_history.detection_dir}")
    print(f"  - Rules log: {analysis_history.rules_dir}")
    print(f"  - Statistics: {analysis_history.stats_dir}")
