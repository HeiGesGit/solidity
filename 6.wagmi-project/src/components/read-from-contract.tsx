import { useReadContract, type BaseError } from "wagmi";
import { useEffect } from "react";
import { address } from "@/utils";
import { abi } from "@/abis/contracts/Raffle.sol/Raffle.json";

function ReadContract({ setValue }: { setValue: (value: string) => void }) {
  const {
    data: enterFee,
    error,
    isPending,
  } = useReadContract({
    abi,
    address,
    functionName: "getEnterFee",
    args: [],
  });

  useEffect(() => {
    if (enterFee) {
      setValue?.(enterFee?.toString());
    }
  }, [enterFee]);

  if (isPending) return <div>Loading...</div>;

  if (error)
    return (
      <div>
        Error: {(error as unknown as BaseError).shortMessage || error.message}
      </div>
    );

  return (
    <div>
      <div>enterFee: {enterFee?.toString()}</div>
    </div>
  );
}

export default ReadContract;
