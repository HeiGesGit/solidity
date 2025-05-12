"use client";

import { ConnectKitButton } from "connectkit";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { SendTransaction } from "@/components/send-transaction";
import ReadContract from "@/components/read-from-contract";
import { useState } from "react";
import { WriteContract } from "@/components/write-contract";

function App() {
  const [enterFee, setEnterFee] = useState("");
  const account = useAccount();
  const { connectors, connect, status, error } = useConnect();
  const { disconnect } = useDisconnect();

  return (
    <>
      <div>
        <h2>Account</h2>
        <div style={{ border: "1px solid #000", padding: 20, marginTop: 10 }}>
          ConnectKitButton:
          <ConnectKitButton />
        </div>
        <div style={{ border: "1px solid #000", padding: 20, marginTop: 10 }}>
          SendTransaction:
          <SendTransaction />
        </div>
        <div style={{ border: "1px solid #000", padding: 20, marginTop: 10 }}>
          ReadContract:
          <ReadContract setValue={setEnterFee} />
        </div>
        <div style={{ border: "1px solid #000", padding: 20, marginTop: 10 }}>
          WriteContract:
          <WriteContract value={enterFee} />
        </div>
        <div>
          status: {account.status}
          <br />
          addresses: {JSON.stringify(account.addresses)}
          <br />
          chainId: {account.chainId}
        </div>

        {account.status === "connected" && (
          <button type="button" onClick={() => disconnect()}>
            Disconnect
          </button>
        )}
      </div>

      <div>
        <h2>Connect</h2>
        {connectors.map((connector) => (
          <button
            key={connector.uid}
            onClick={() => connect({ connector })}
            type="button"
          >
            {connector.name}
          </button>
        ))}
        <div>{status}</div>
        <div>{error?.message}</div>
      </div>
    </>
  );
}

export default App;
