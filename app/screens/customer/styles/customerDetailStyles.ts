import { StyleSheet } from "react-native";

export const customerDetailStyles = StyleSheet.create({
  container: { padding: 20 },
  label: { color: "#888", marginTop: 12, fontSize: 12 },
  value: { fontSize: 16, fontWeight: "600", color: "#000" },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    marginTop: 16,
    backgroundColor: "#EAF4FF",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeTxt: { color: "#0066FF", fontWeight: "600" },
  /* orders */
  emptyText: { marginTop: 8, color: "#999" },
  orderCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 14,
    marginTop: 12,
    elevation: 1,
  },
  orderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  orderKey: { color: "#555" },
  orderVal: { fontWeight: "600", color: "#000" },

  /* Modal Top-Up Styles */
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    width: "80%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    backgroundColor: "#fff",
  },
});
