import { Statement } from "delib-npm";
import { doc, updateDoc } from "firebase/firestore";
import { FireStore } from "@/controllers/db/config";

export const updateStatement = async (updatedStatement: Statement) => {
  if (!updatedStatement.statementId) {
    throw new Error("Statement must have a statementId to be updated.");
  }

  const statementRef = doc(
    FireStore,
    "statements",
    updatedStatement.statementId
  );

  await updateDoc(statementRef, {
    statement: updatedStatement.statement,
    description: updatedStatement.description,
    updatedAt: new Date().toISOString(),
  });
};
