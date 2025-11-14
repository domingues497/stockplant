import { useQuery } from "@tanstack/react-query";

export const useFetch = <T,>(key: unknown[], fn: () => Promise<T>) => {
  const { data, isLoading, error } = useQuery({ queryKey: key, queryFn: fn });
  return { data, isLoading, error };
};

