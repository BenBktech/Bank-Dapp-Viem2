'use client'
// import Contract from '../../../backend/artifacts/contracts/Bank.sol'
import { Flex, Alert, AlertIcon, Heading, Input, Button, Text, useToast, Spinner } from '@chakra-ui/react'

// Wagmi
import { prepareWriteContract, writeContract, readContract } from '@wagmi/core'
import { useAccount, usePublicClient } from 'wagmi'

// Contracts informations
import { abi, contractAddress } from '@/constants'

// ReactJS
import { useState, useEffect } from 'react'

// Viem
import { formatEther, parseEther, createPublicClient, http, parseAbiItem } from 'viem'
import { hardhat } from 'viem/chains'

const Bank = () => {

    // Client Viem
    const client = usePublicClient()

    // Balance of the user State
    const [balance, setBalance] = useState(0)

    // Input States
    const [depositAmount, setDepositAmount] = useState(0)
    const [withdrawAmount, setWithdrawAmount] = useState(0)

    // Events States
    const [depositEvents, setDepositEvents] = useState([])
    const [withdrawEvents, setWithdrawEvents] = useState([])

    // IsLoading 
    const [isLoading, setIsLoading] = useState(false)

    // Toast
    const toast = useToast()

    // Account's informations
    const { address, isConnected } = useAccount()

    // Deposit Function
    const deposit = async() => {
        try {
            setIsLoading(true)
            const { request } = await prepareWriteContract({
                address: contractAddress,
                abi: abi,
                functionName: 'deposit',
                value: parseEther(depositAmount)
            })
            const { hash } = await writeContract(request)
            const balance = await getBalanceOfUser()
            setBalance(formatEther(balance))
            await getEvents()
            setDepositAmount('')
            setIsLoading(false)
            toast({
                title: 'Congratulations',
                description: "You have deposited ethers on the contract.",
                status: 'success',
                duration: 4000,
                isClosable: true,
            })
        }
        catch(err) {
            console.log(err.message)
            toast({
                title: 'Error',
                description: "An error occured.",
                status: 'error',
                duration: 4000,
                isClosable: true,
            })
        }  
    }

    // Withdraw Function
    const withdraw = async() => {
        
        try {
            setIsLoading(true)
            const { request } = await prepareWriteContract({
                address: contractAddress,
                abi: abi,
                functionName: 'withdraw',
                args: [parseEther(withdrawAmount)]
            })
            const { hash } = await writeContract(request)
            const balance = await getBalanceOfUser()
            setBalance(formatEther(balance))
            await getEvents()
            setWithdrawAmount('')
            setIsLoading(false)
            toast({
                title: 'Congratulations',
                description: "You have withdrawed ethers from the contract.",
                status: 'success',
                duration: 4000,
                isClosable: true,
            })
        }
        catch(err) {
            console.log(err.message)
            toast({
                title: 'Error',
                description: "An error occured.",
                status: 'error',
                duration: 4000,
                isClosable: true,
            })
        }  
    }

    // Get the balance of the user
    const getBalanceOfUser = async() => {
        try {
            const data = await readContract({
                address: contractAddress,
                abi: abi,
                functionName: 'getBalanceOfUser',
                account: address
            })
            return data
        }   
        catch(err) {
            console.log(err.message)
        }
    }

    // Get all the events with Viem
    const getEvents = async() => {
        // Deposit
        const depositLogs = await client.getLogs({  
            address: contractAddress,
            event: parseAbiItem('event etherDeposited(address indexed account, uint amount)'),
            // fromBlock: BigInt(Number(await client.getBlockNumber()) - 15000),
            fromBlock: 0n,
            toBlock: 'latest'
        })
        setDepositEvents(depositLogs.map(
            log => ({
                address: log.args.account,
                amount: log.args.amount
            })
        ))

        // Withdraw
        const withdrawLogs = await client.getLogs({  
            address: contractAddress,
            event: parseAbiItem('event etherWithdrawed(address indexed account, uint amount)'),
            // fromBlock: BigInt(Number(await client.getBlockNumber()) - 15000),
            fromBlock: 0n,
            toBlock: 'latest'
        })
        setWithdrawEvents(withdrawLogs.map(
            log => ({
                address: log.args.account,
                amount: log.args.amount
            })
        ))
    }

    useEffect(() => {
        const getBalanceAndEvents = async() => {
            if(!isConnected) return
            const balance = await getBalanceOfUser()
            setBalance(formatEther(balance))
            await getEvents()
        }
        getBalanceAndEvents()
    }, [address])

    
    
    return (
        <Flex p='2rem'>
            {isLoading 
            ? ( <Spinner /> ) 
            : ( isConnected ? (
                <Flex direction="column" width='100%'>
                    <Heading as='h2' size='xl'>
                        Your balance in the Bank
                    </Heading>
                    <Text mt='1rem'>{balance} Eth</Text>
                    <Heading as='h2' size='xl' mt='2rem'>
                        Deposit
                    </Heading>
                    <Flex mt='1rem'>
                        <Input placeholder="Amount in Eth" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} />
                        <Button colorScheme='purple' onClick={deposit}>Deposit</Button>
                    </Flex>
                    <Heading as='h2' size='xl' mt='2rem'>
                        Withdraw
                    </Heading>
                    <Flex mt='1rem'>
                        <Input placeholder="Amount in Eth" value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} />
                        <Button colorScheme='purple' onClick={withdraw}>Withdraw</Button>
                    </Flex>
                    <Heading as='h2' size='xl' mt='2rem'>
                        Deposit Events
                    </Heading>
                    <Flex mt='1rem' direction='column'>
                        {depositEvents.length > 0 ? depositEvents.map((event) => {
                            return <Flex key={crypto.randomUUID()}>
                                <Text>{event.address.substring(0,6)}...{event.address.substring(event.address.length - 5)} - {formatEther(event.amount)} Eth</Text>
                            </Flex>
                        }) : <Text>No Deposit Events</Text>}
                    </Flex>
                    <Heading as='h2' size='xl' mt='2rem'>
                        Withdraw Events
                    </Heading>
                    <Flex mt='1rem' direction='column'>
                        {withdrawEvents.length > 0 ? withdrawEvents.map((event) => {
                            return <Flex key={crypto.randomUUID()}>
                                <Text>{event.address.substring(0,6)}...{event.address.substring(event.address.length - 5)} - {formatEther(event.amount)} Eth</Text>
                            </Flex>
                        }) : <Text>No Withdraw Events</Text>}
                    </Flex>
                </Flex>
            ) : (
                <Alert status='warning'>
                    <AlertIcon />
                    Please connect your Wallet to our DApp.
                </Alert>
            )) }
        </Flex>
    )
}

export default Bank